/**
 * Super Admin Dashboard API (/api/admin/dashboard/*)
 *
 * Metric definitions (keep in sync with adminDashboardService.js):
 *
 * - totalRevenue: Rolling 30 days (UTC) sum of Invoice.total where status ∉ {DRAFT, CANCELLED}.
 *   changePercent vs the prior 30-day window. Not Stripe — internal invoice ledger only.
 *
 * - subscriptions: Total Tenant count (organizations). changePercent compares new tenants created
 *   in the last 30 days vs the previous 30 days.
 *
 * - users: Total User rows with tenantId set (tenant end-users). changePercent compares new
 *   such users in last 30d vs previous 30d.
 *
 * - activeNow: Users with lastSeenAt within ACTIVE_NOW_MS (5 min). deltaSinceLastHour =
 *   (users with lastSeenAt within 60 min) minus activeNow. Clients should PATCH
 *   /api/users/me/presence to refresh lastSeenAt.
 *
 * Env: ADMIN_DASHBOARD_CURRENCY (default USD) — display label only.
 */

import { prisma } from '../lib/prisma.js';
import {
  ACTIVE_NOW_MS,
  ACTIVE_HOUR_MS,
  NEW_USER_STATUS_DAYS,
  MONTH_LABELS,
  SHORT_WEEK,
  addDaysUTC,
  aggregateTrafficForWindow,
  countActiveInHour,
  countActiveNow,
  countNewTenantUsersBetween,
  countTenantsCreatedBetween,
  countUsersWithTenant,
  dashboardCurrency,
  fetchTrafficDaysInRange,
  fillTrafficGaps,
  parseRangeDays,
  pctChange,
  sumInvoiceTotalExcluding,
  utcDayStart,
} from '../services/adminDashboardService.js';

const DEFAULT_RECENT_LIMIT = 10;
const MAX_RECENT_LIMIT = 50;

function rollingWindows() {
  const now = new Date();
  const end = now;
  const start30 = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start60 = new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);
  return {
    curStart: start30,
    curEnd: end,
    prevStart: start60,
    prevEnd: start30,
  };
}

export async function getDashboardSummary(req, res, next) {
  try {
    const { curStart, curEnd, prevStart, prevEnd } = rollingWindows();

    const [
      revCur,
      revPrev,
      tenantsNow,
      tenantsNewCur,
      tenantsNewPrev,
      usersTotal,
      usersNewCur,
      usersNewPrev,
      active5,
      active60,
    ] = await Promise.all([
      sumInvoiceTotalExcluding({ start: curStart, end: curEnd }),
      sumInvoiceTotalExcluding({ start: prevStart, end: prevEnd }),
      prisma.tenant.count(),
      countTenantsCreatedBetween(curStart, curEnd),
      countTenantsCreatedBetween(prevStart, prevEnd),
      countUsersWithTenant(),
      countNewTenantUsersBetween(curStart, curEnd),
      countNewTenantUsersBetween(prevStart, prevEnd),
      countActiveNow(new Date(Date.now() - ACTIVE_NOW_MS)),
      countActiveInHour(new Date(Date.now() - ACTIVE_HOUR_MS)),
    ]);

    const currency = dashboardCurrency();
    const deltaSinceLastHour = Math.max(0, active60 - active5);

    res.json({
      totalRevenue: {
        value: Math.round(revCur * 100) / 100,
        currency,
        changePercent: pctChange(revCur, revPrev),
        periodLabel: 'from last month',
      },
      subscriptions: {
        value: tenantsNow,
        changePercent: pctChange(tenantsNewCur, tenantsNewPrev),
        periodLabel: 'from last month',
      },
      users: {
        value: usersTotal,
        changePercent: pctChange(usersNewCur, usersNewPrev),
        periodLabel: 'from last month',
      },
      activeNow: {
        value: active5,
        deltaSinceLastHour,
        periodLabel: 'since last hour',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getActiveSessionsCount(req, res, next) {
  try {
    const count = await countActiveNow(new Date(Date.now() - ACTIVE_NOW_MS));
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueByMonth(req, res, next) {
  try {
    const y = parseInt(String(req.query.year || new Date().getUTCFullYear()), 10);
    const year = Number.isNaN(y) ? new Date().getUTCFullYear() : y;

    const months = await Promise.all(
      Array.from({ length: 12 }, async (_, idx) => {
        const m = idx + 1;
        const start = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
        const total = await sumInvoiceTotalExcluding({ start, end });
        return {
          month: m,
          label: MONTH_LABELS[m - 1],
          total: Math.round(Number(total) * 100) / 100,
        };
      })
    );

    res.json({ year, data: months });
  } catch (err) {
    next(err);
  }
}

function recentUserStatus(u, now) {
  if (!u.isActive) return 'inactive';
  const newCut = new Date(now.getTime() - NEW_USER_STATUS_DAYS * 24 * 60 * 60 * 1000);
  if (u.createdAt >= newCut) return 'new';
  const seen = u.lastSeenAt && u.lastSeenAt >= new Date(now.getTime() - ACTIVE_NOW_MS);
  if (seen) return 'active';
  return 'active';
}

export async function getRecentUsers(req, res, next) {
  try {
    const limit = Math.min(
      parseInt(String(req.query.limit || DEFAULT_RECENT_LIMIT), 10) || DEFAULT_RECENT_LIMIT,
      MAX_RECENT_LIMIT
    );
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : null;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const [newUsersThisMonth, users] = await Promise.all([
      prisma.user.count({
        where: {
          tenantId: { not: null },
          createdAt: { gte: monthStart },
        },
      }),
      prisma.user.findMany({
        where: {
          tenantId: { not: null },
          ...(cursor && !Number.isNaN(cursor) ? { id: { lt: cursor } } : {}),
        },
        take: limit + 1,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          lastSeenAt: true,
        },
      }),
    ]);

    const hasMore = users.length > limit;
    const slice = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const data = slice.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      status: recentUserStatus(u, now),
      lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));

    res.json({
      meta: { newUsersThisMonth, nextCursor },
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsTraffic(req, res, next) {
  try {
    const days = parseRangeDays(req.query.range);
    const end = utcDayStart(new Date());
    const start = addDaysUTC(end, -(days - 1));
    const rows = await fetchTrafficDaysInRange(start, end);
    const filled = fillTrafficGaps(start, end, rows);

    const data = filled.map((r) => {
      const d = utcDayStart(new Date(r.day));
      return {
        date: d.toISOString().slice(0, 10),
        label: SHORT_WEEK[d.getUTCDay()],
        clicks: r.clicks,
        uniques: r.uniques,
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsKpis(req, res, next) {
  try {
    const days = parseRangeDays(req.query.range);
    const end = utcDayStart(new Date());
    const start = addDaysUTC(end, -(days - 1));
    const prevEnd = addDaysUTC(start, -1);
    const prevStart = addDaysUTC(prevEnd, -(days - 1));

    const [cur, prev] = await Promise.all([
      aggregateTrafficForWindow(start, end),
      aggregateTrafficForWindow(prevStart, prevEnd),
    ]);

    const avgDeltaSec = cur.avgSessionSeconds - prev.avgSessionSeconds;
    const periodCmp = days === 7 ? 'vs last week' : `vs prior ${days} days`;

    res.json({
      totalClicks: {
        value: cur.clicks,
        changePercent: pctChange(cur.clicks, prev.clicks),
        periodLabel: periodCmp,
      },
      uniqueVisitors: {
        value: cur.uniques,
        changePercent: pctChange(cur.uniques, prev.uniques),
        periodLabel: periodCmp,
      },
      bounceRate: {
        value: cur.bounceRate,
        unit: 'percent',
        changePercent: pctChange(cur.bounceRate, prev.bounceRate),
        periodLabel: periodCmp,
      },
      avgSessionSeconds: {
        value: cur.avgSessionSeconds,
        changePercent: pctChange(cur.avgSessionSeconds, prev.avgSessionSeconds),
        periodLabel:
          avgDeltaSec === 0
            ? periodCmp
            : `${avgDeltaSec > 0 ? '+' : ''}${Math.round(avgDeltaSec)}s ${periodCmp}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsReferrers(req, res, next) {
  try {
    const days = parseRangeDays(req.query.range);
    const end = utcDayStart(new Date());
    const start = addDaysUTC(end, -(days - 1));

    const raw = await prisma.platformReferrerDay.groupBy({
      by: ['name'],
      where: { day: { gte: start, lte: end } },
      _sum: { count: true },
    });

    const data = raw
      .map((r) => ({ name: r.name, value: r._sum.count ?? 0 }))
      .sort((a, b) => b.value - a.value);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsDevices(req, res, next) {
  try {
    const days = parseRangeDays(req.query.range);
    const rangeDays = days >= 15 ? 30 : 7;

    const rows = await prisma.platformDeviceShare.findMany({
      where: { rangeDays },
      orderBy: { percent: 'desc' },
    });

    const data = rows.map((r) => ({
      name: r.name,
      percent: Math.round(Number(r.percent) * 100) / 100,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}
