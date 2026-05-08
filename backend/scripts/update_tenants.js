import { prisma } from '../src/lib/prisma.js';
import { seedItemTypes, seedFamilyCoA } from '../src/services/accountingService.js';

async function main() {
    const tenants = await prisma.tenant.findMany();
    for (const tenant of tenants) {
        console.log(`Updating tenant ${tenant.id} (${tenant.name})...`);
        try {
            await seedItemTypes(tenant.id);
            await seedFamilyCoA(tenant.id);
            console.log(`✅ Updated tenant ${tenant.id}`);
        } catch (err) {
            console.error(`❌ Failed to update tenant ${tenant.id}:`, err.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
