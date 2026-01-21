import { PrismaClient } from '@prisma/client';
import { seedFamilyCoA, seedFamilyCategories, seedFamilyPaymentMethods } from '../src/services/accountingService.js';

const prisma = new PrismaClient();

async function seedTenant14() {
    try {
        console.log('🌱 Seeding accounts, categories, and payment methods for tenant 14...\n');

        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: 14 }
        });

        if (!tenant) {
            console.error('❌ Tenant 14 not found');
            return;
        }

        console.log(`✅ Found tenant: ${tenant.name} (ID: ${tenant.id})`);

        // Check current accounts
        const existingAccounts = await prisma.account.count({
            where: { tenantId: 14 }
        });

        console.log(`   Current accounts: ${existingAccounts}`);

        // Seed Chart of Accounts
        console.log('\n📊 Seeding Chart of Accounts...');
        await seedFamilyCoA(14);
        console.log('   ✅ Chart of Accounts seeded');

        // Seed Categories
        console.log('\n🏷️  Seeding Categories...');
        await seedFamilyCategories(14);
        console.log('   ✅ Categories seeded');

        // Seed Payment Methods
        console.log('\n💳 Seeding Payment Methods...');
        await seedFamilyPaymentMethods(14);
        console.log('   ✅ Payment Methods seeded');

        // Verify results
        const finalAccounts = await prisma.account.count({
            where: { tenantId: 14 }
        });
        const finalCategories = await prisma.category.count({
            where: { tenantId: 14 }
        });
        const finalPaymentMethods = await prisma.paymentMethod.count({
            where: { tenantId: 14 }
        });

        console.log('\n✅ Seeding complete for tenant 14!');
        console.log(`   📊 Accounts: ${finalAccounts}`);
        console.log(`   🏷️  Categories: ${finalCategories}`);
        console.log(`   💳 Payment Methods: ${finalPaymentMethods}`);

    } catch (error) {
        console.error('❌ Error seeding tenant 14:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedTenant14();
