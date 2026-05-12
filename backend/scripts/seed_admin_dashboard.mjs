/**
 * Seeds platform analytics tables + optional demo lastSeenAt for Super Admin dashboard.
 * Run: node scripts/seed_admin_dashboard.mjs
 * Requires: DATABASE_URL, prisma migrate/db push applied (platform_* tables + users.last_seen_at).
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

function utcDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDays(day, n) {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + n, 0, 0, 0, 0));
}

async function main() {
  const today = utcDay(new Date());
  const horizon = addDays(today, -120);

  await prisma.platformReferrerDay.deleteMany({ where: { day: { gte: horizon } } });
  await prisma.platformTrafficDay.deleteMany({ where: { day: { gte: horizon } } });
  await prisma.platformDeviceShare.deleteMany({ where: { rangeDays: { in: [7, 30] } } });

  const trafficRows = [];
  const referrerRows = [];

  for (let i = 0; i < 90; i++) {
    const day = addDays(today, -i);
    const wobble = ((i * 17) % 31) * 8;
    const clicks = 180 + wobble + (i % 5) * 22;
    const uniques = Math.max(40, Math.floor(clicks * 0.72));
    const bounceRate = 32 + (i % 11) * 0.8;
    const avgSessionSeconds = 120 + (i % 9) * 15;

    trafficRows.push({
      day,
      clicks,
      uniques,
      bounceRate,
      avgSessionSeconds,
    });

    const refBase = 40 + (i % 7) * 5;
    referrerRows.push(
      { day, name: 'Direct', count: refBase + 120 },
      { day, name: 'Google', count: refBase + 55 },
      { day, name: 'Twitter', count: refBase + 20 },
      { day, name: 'Newsletter', count: refBase + 15 }
    );
  }

  await prisma.platformTrafficDay.createMany({ data: trafficRows });
  await prisma.platformReferrerDay.createMany({ data: referrerRows });

  const devices7 = [
    { rangeDays: 7, name: 'Desktop', percent: 72 },
    { rangeDays: 7, name: 'Mobile', percent: 24 },
    { rangeDays: 7, name: 'Tablet', percent: 4 },
  ];
  const devices30 = [
    { rangeDays: 30, name: 'Desktop', percent: 68 },
    { rangeDays: 30, name: 'Mobile', percent: 28 },
    { rangeDays: 30, name: 'Tablet', percent: 4 },
  ];

  for (const row of [...devices7, ...devices30]) {
    await prisma.platformDeviceShare.upsert({
      where: {
        rangeDays_name: { rangeDays: row.rangeDays, name: row.name },
      },
      create: row,
      update: { percent: row.percent, snapshotAt: new Date() },
    });
  }

  const sampleUsers = await prisma.user.findMany({
    where: { tenantId: { not: null } },
    take: 12,
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  const now = Date.now();
  for (let j = 0; j < sampleUsers.length; j++) {
    const u = sampleUsers[j];
    const lastSeen = new Date(now - (j % 5) * 60 * 1000);
    await prisma.user.update({
      where: { id: u.id },
      data: { lastSeenAt: lastSeen },
    });
  }

  console.log(`Seeded ${trafficRows.length} traffic days, ${referrerRows.length} referrer rows, device shares, ${sampleUsers.length} user lastSeenAt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
