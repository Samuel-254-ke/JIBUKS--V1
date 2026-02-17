
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Hardcoded tenant ID for the user's workspace (usually 1 for single tenant dev)
    // In a real app, this would iterate all tenants or be passed as an arg.
    const tenantId = 1;

    console.log(`🌱 Seeding Payable Accounts for Tenant ${tenantId}...`);

    // 1. Ensure "Accounts Payable" (Parent) exists
    let parentAP = await prisma.account.findFirst({
        where: {
            tenantId,
            code: '2000', // Standard code for AP
        }
    });

    if (!parentAP) {
        console.log('Creating Parent Account: Accounts Payable (2000)...');
        parentAP = await prisma.account.create({
            data: {
                tenantId,
                code: '2000',
                name: 'Accounts Payable',
                type: 'LIABILITY',
                subtype: 'ap',
                systemTag: 'AP',
                isControl: true,
                isActive: true,
                description: 'Outstanding bills to be paid'
            }
        });
    } else {
        console.log('Found Parent Account: Accounts Payable (2000)');
        // Ensure it's marked as control/AP
        await prisma.account.update({
            where: { id: parentAP.id },
            data: { isControl: true, systemTag: 'AP', subtype: 'ap' }
        });
    }

    // 2. Create Child Payable Accounts
    const childAccounts = [
        { name: 'Rent Payable', code: '2001' },
        { name: 'Utilities Payable', code: '2002' },
        { name: 'Internet Payable', code: '2003' },
        { name: 'Salaries Payable', code: '2004' },
        { name: 'Taxes Payable', code: '2005' },
        { name: 'Consultant Payable', code: '2006' }
    ];

    for (const acc of childAccounts) {
        const exists = await prisma.account.findFirst({
            where: { tenantId, code: acc.code }
        });

        if (!exists) {
            console.log(`Creating Child Account: ${acc.name} (${acc.code})...`);
            await prisma.account.create({
                data: {
                    tenantId,
                    code: acc.code,
                    name: acc.name,
                    type: 'LIABILITY',
                    subtype: 'ap',
                    parentId: parentAP.id, // THE HIERARCHY LINK
                    isActive: true,
                    description: `Sub-account for ${acc.name}`
                }
            });
        } else {
            console.log(`Updating Child Account: ${acc.name} (${acc.code}) check parent linkage...`);
            // Ensure parent is linked
            if (exists.parentId !== parentAP.id) {
                await prisma.account.update({
                    where: { id: exists.id },
                    data: { parentId: parentAP.id }
                });
            }
        }
    }

    console.log('✅ Payables Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
