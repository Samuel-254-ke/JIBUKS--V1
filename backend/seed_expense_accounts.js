
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding expense accounts...');

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('No tenant found. Please create a user/tenant first.');
        return;
    }

    const expenseAccounts = await prisma.account.findMany({
        where: {
            tenantId: tenant.id,
            type: 'EXPENSE',
        },
    });

    if (expenseAccounts.length > 0) {
        console.log(`Found ${expenseAccounts.length} existing expense accounts.`);
        console.log(expenseAccounts.map(a => `${a.code} - ${a.name}`));
        return;
    }

    const newAccounts = [
        { code: '5001', name: 'Cost of Goods Sold', type: 'EXPENSE' },
        { code: '6001', name: 'Rent Expense', type: 'EXPENSE' },
        { code: '6002', name: 'Utilities', type: 'EXPENSE' },
        { code: '6003', name: 'Office Supplies', type: 'EXPENSE' },
        { code: '6004', name: 'Internet & Telephone', type: 'EXPENSE' },
    ];

    for (const acc of newAccounts) {
        await prisma.account.create({
            data: {
                tenantId: tenant.id,
                ...acc,
            },
        });
        console.log(`Created account: ${acc.name}`);
    }

    console.log('Seeding complete! 🚀');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
