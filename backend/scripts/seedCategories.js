import { prisma } from '../src/lib/prisma.js';

const defaultCategories = [
    // Expense categories
    { name: 'Food', type: 'expense', icon: 'cart', color: '#FF6B6B' },
    { name: 'Transport', type: 'expense', icon: 'car', color: '#4ECDC4' },
    { name: 'Housing', type: 'expense', icon: 'home', color: '#45B7D1' },
    { name: 'Utilities', type: 'expense', icon: 'flash', color: '#FFA07A' },
    { name: 'Entertainment', type: 'expense', icon: 'film', color: '#98D8C8' },
    { name: 'Healthcare', type: 'expense', icon: 'medical', color: '#F7DC6F' },
    { name: 'Education', type: 'expense', icon: 'school', color: '#BB8FCE' },
    { name: 'Shopping', type: 'expense', icon: 'bag', color: '#85C1E2' },

    // Income categories
    { name: 'Salary', type: 'income', icon: 'cash', color: '#52C41A' },
    { name: 'Business', type: 'income', icon: 'briefcase', color: '#1890FF' },
    { name: 'Investment', type: 'income', icon: 'trending-up', color: '#722ED1' },
    { name: 'Gift', type: 'income', icon: 'gift', color: '#EB2F96' },
    { name: 'Other', type: 'income', icon: 'ellipsis-horizontal', color: '#8C8C8C' },
];

async function seedCategories() {
    try {
        console.log('🌱 Seeding categories...');

        // Get all tenants
        const tenants = await prisma.tenant.findMany();

        if (tenants.length === 0) {
            console.log('⚠️  No tenants found. Create a family first.');
            return;
        }

        for (const tenant of tenants) {
            console.log(`\n📦 Seeding categories for tenant: ${tenant.name}`);

            for (const category of defaultCategories) {
                try {
                    const created = await prisma.category.upsert({
                        where: {
                            tenantId_name_type: {
                                tenantId: tenant.id,
                                name: category.name,
                                type: category.type
                            }
                        },
                        update: {
                            icon: category.icon,
                            color: category.color
                        },
                        create: {
                            tenantId: tenant.id,
                            ...category
                        }
                    });
                    console.log(`  ✓ ${category.type}: ${category.name}`);
                } catch (error) {
                    console.error(`  ✗ Error creating ${category.name}:`, error.message);
                }
            }
        }

        console.log('\n✅ Categories seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedCategories();
