/**
 * Super Admin Dashboard — metric definitions (see also adminDashboardController.js header)
 *
 * Total revenue: Sum of Invoice.total for invoiceDate in the period, excluding status
 *   DRAFT and CANCELLED. Currency label from env ADMIN_DASHBOARD_CURRENCY (default USD);
 *   amounts are stored as in DB (no FX conversion).
 *
 * Subscriptions: Count of Tenant rows (organizations on the platform). changePercent compares
 *   new tenants created in the current calendar month vs the previous calendar month.
 *
 * Users: Count of User rows with tenantId NOT NULL (registered tenant end-users, not platform admins).
 *
 * Active now: Users with lastSeenAt within the last 5 minutes (see ACTIVE_NOW_MS).
 *   deltaSinceLastHour: users with lastSeenAt in the last 60 minutes minus active now
 *   (broader “in the last hour” tail — approximate; not a stored hourly snapshot).
 *
 * Analytics traffic/clicks: Rows in platform_traffic_days (seed or future ingestion). “Clicks”
 *   are synthetic page-view / event counts until real logging is wired.
 */

import { prisma } from '../lib/prisma.js';

export const ACTIVE_NOW_MS = 5 * 60 * 1000;
export const ACTIVE_HOUR_MS = 60 * 60 * 1000;
export const NEW_USER_STATUS_DAYS = 14;

export function dashboardCurrency() {
  return process.env.ADMIN_DASHBOARD_CURRENCY || 'USD';
}

export function utcMonthRange(year, monthIndex0) {
  const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export function calendarMonthToDateRangeUTC(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const startThis = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const endThis = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  const startPrev = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const endPrev = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { startThis, endThis, startPrev, endPrev };
}

export function pctChange(current, previous) {
  if (previous == null || Number(previous) === 0) {
    if (current == null || Number(current) === 0) return null;
    return Math.round(Number(current) * 10) / 10;
  }
  const p = Number(previous);
  const c = Number(current);
  return Math.round(((c - p) / p) * 1000) / 10;
}

export async function sumInvoiceTotalExcluding({ start, end }) {
  const agg = await prisma.invoice.aggregate({
    where: {
      invoiceDate: { gte: start, lte: end },
      status: { notIn: ['DRAFT', 'CANCELLED'] },
    },
    _sum: { total: true },
  });
  return Number(agg._sum.total ?? 0);
}

export async function countTenantsCreatedBetween(start, end) {
  return prisma.tenant.count({
    where: { createdAt: { gte: start, lte: end } },
  });
}

export async function countUsersWithTenant() {
  return prisma.user.count({ where: { tenantId: { not: null } } });
}

export async function countNewTenantUsersBetween(start, end) {
  return prisma.user.count({
    where: {
      tenantId: { not: null },
      createdAt: { gte: start, lte: end },
    },
  });
}

export async function countActiveNow(since = new Date(Date.now() - ACTIVE_NOW_MS)) {
  return prisma.user.count({
    where: {
      tenantId: { not: null },
      isActive: true,
      lastSeenAt: { gte: since },
    },
  });
}

export async function countActiveInHour(since = new Date(Date.now() - ACTIVE_HOUR_MS)) {
  return prisma.user.count({
    where: {
      tenantId: { not: null },
      isActive: true,
      lastSeenAt: { gte: since },
    },
  });
}

export function parseRangeDays(range) {
  if (range === '30d') return 30;
  if (range === '7d' || range == null || range === '') return 7;
  const m = String(range).match(/^(\d+)d$/);
  if (m) return Math.min(365, Math.max(1, parseInt(m[1], 10)));
  return 7;
}

export function utcDayStart(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function addDaysUTC(dayStart, n) {
  return new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate() + n, 0, 0, 0, 0));
}

const SHORT_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export { MONTH_LABELS, SHORT_WEEK };

export async function fetchTrafficDaysInRange(startDay, endDay) {
  return prisma.platformTrafficDay.findMany({
    where: {
      day: { gte: startDay, lte: endDay },
    },
    orderBy: { day: 'asc' },
  });
}

export function fillTrafficGaps(startDay, endDay, rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.day.toISOString().slice(0, 10);
    map.set(key, r);
  }
  const out = [];
  let d = utcDayStart(new Date(startDay));
  const end = utcDayStart(new Date(endDay));
  while (d.getTime() <= end.getTime()) {
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    out.push(
      row || {
        day: new Date(d),
        clicks: 0,
        uniques: 0,
        bounceRate: 0,
        avgSessionSeconds: 0,
      }
    );
    d = addDaysUTC(d, 1);
  }
  return out;
}

export async function aggregateTrafficForWindow(startDay, endDay) {
  const rows = await fetchTrafficDaysInRange(startDay, endDay);
  let clicks = 0;
  let uniques = 0;
  let bounceNum = 0;
  let bounceDen = 0;
  let sessionNum = 0;
  let sessionDen = 0;
  for (const r of rows) {
    clicks += r.clicks;
    uniques += r.uniques;
    const br = Number(r.bounceRate);
    bounceNum += br * r.clicks;
    bounceDen += r.clicks;
    sessionNum += r.avgSessionSeconds * r.uniques;
    sessionDen += r.uniques;
  }
  const bounceRate = bounceDen > 0 ? Math.round((bounceNum / bounceDen) * 100) / 100 : 0;
  const avgSessionSeconds = sessionDen > 0 ? Math.round(sessionNum / sessionDen) : 0;
  return { clicks, uniques, bounceRate, avgSessionSeconds };
}
