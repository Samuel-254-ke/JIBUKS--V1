import { PrismaClient } from '@prisma/client';

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in environment variables!');
  console.error('Please check your .env file.');
  process.exit(1);
}

// Create Prisma client — connects lazily on first query
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

console.log('✅ Prisma client initialized');

function getPrismaClient() {
  return prisma;
}

export {
  prisma,
  getPrismaClient,
};
