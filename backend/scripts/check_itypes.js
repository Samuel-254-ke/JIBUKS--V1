import { prisma } from '../src/lib/prisma.js';

async function main() {
    const tenantId = 1; // Assuming tenant 1 is the main one
    const itypes = await prisma.itemType.findMany({ where: { tenantId } });
    console.log('Item Types:', JSON.stringify(itypes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
