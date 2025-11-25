import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get Prisma client instance
 */
function getPrismaClient() {
  return prisma;
}

export {
  prisma,
  getPrismaClient,
};
