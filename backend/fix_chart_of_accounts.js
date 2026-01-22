import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Chart of Accounts Repair...');

    // 1. Get the Tenant (Family)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('❌ No Tenant/Family found! Please signup/login specific user first.');
        return;
    }
    console.log(`✅ Found Tenant: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Define Standard Accounts
    const standardAccounts = [
        // ASSETS (For Payments)
        { code: '1000', name: 'Cash on Hand', type: 'ASSET' },
        { code: '1010', name: 'Bank Account (Main)', type: 'ASSET' },
        { code: '1020', name: 'Mobile Money / M-Pesa', type: 'ASSET' },
        { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },

        // LIABILITIES
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        { code: '2010', name: 'Sales Tax Payable', type: 'LIABILITY' },

        // EQUITY
        { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY' },

        // INCOME
        { code: '4000', name: 'Sales Income', type: 'INCOME' },
        { code: '4010', name: 'Service Revenue', type: 'INCOME' },

        // EXPENSES (For Bills)
        { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
        { code: '6000', name: 'Rent Expense', type: 'EXPENSE' },
        { code: '6010', name: 'Utilities', type: 'EXPENSE' },
        { code: '6020', name: 'Salaries & Wages', type: 'EXPENSE' },
        { code: '6030', name: 'Office Supplies', type: 'EXPENSE' },
        { code: '6040', name: 'Repairs & Maintenance', type: 'EXPENSE' }
    ];

    let createdCount = 0;

    for (const acc of standardAccounts) {
        // Check if exists by name or code
        const existing = await prisma.account.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [
                    { code: acc.code },
                    { name: acc.name }
                ]
            }
        });

        if (!existing) {
            await prisma.account.create({
                data: {
                    tenantId: tenant.id,
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    currency: 'KES',
                    isActive: true
                }
            });
            console.log(`   ➕ Created: [${acc.type}] ${acc.name}`);
            createdCount++;
        } else {
            // console.log(`   Example: ${acc.name} already exists.`);
        }
    }

    console.log(`\n🎉 Repair Complete! Created ${createdCount} missing accounts.`);
    console.log('👉 You should now see "Cash", "Bank", etc. in your Pay Supplier dropdown.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
