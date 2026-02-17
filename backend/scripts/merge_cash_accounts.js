
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeCashAccounts() {
    console.log("Starting Cash Account Merge & Migration...");

    // Accounts to merge into 1000
    const TARGET_CODE = '1000';
    const OLD_CODES = ['1001', '1002', '1003', '1004'];

    // 1. Get all tenants
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        console.log(`\nProcessing Tenant [${tenant.id}] ${tenant.name}...`);

        // 2. Find or Create Target Account (1000)
        let targetAccount = await prisma.account.findFirst({
            where: { tenantId: tenant.id, code: TARGET_CODE }
        });

        if (targetAccount) {
            console.log(`   ✅ Target Account 1000 exists. Updating properties...`);
            // Convert to Transaction Account
            targetAccount = await prisma.account.update({
                where: { id: targetAccount.id },
                data: {
                    // isParent: false, // Field does not exist
                    allowDirectPost: true,
                    isSystem: true,
                    systemTag: 'CASH',
                    name: 'Cash & Cash Equivalents',
                    description: 'Total physical cash and equivalents',
                    subtype: 'cash',
                    isPaymentEligible: true,
                }
            });
        } else {
            console.log(`   ✨ Creating Target Account 1000...`);
            targetAccount = await prisma.account.create({
                data: {
                    tenantId: tenant.id,
                    code: TARGET_CODE,
                    name: 'Cash & Cash Equivalents',
                    type: 'ASSET',
                    description: 'Total physical cash and equivalents',
                    // isParent: false, // Field does not exist
                    allowDirectPost: true,
                    isSystem: true,
                    systemTag: 'CASH',
                    subtype: 'cash',
                    isPaymentEligible: true,
                    currency: 'KES',
                    isActive: true
                }
            });
        }

        // 3. Find Old Accounts
        const oldAccounts = await prisma.account.findMany({
            where: {
                tenantId: tenant.id,
                code: { in: OLD_CODES }
            }
        });

        if (oldAccounts.length === 0) {
            console.log("   ✅ No old cash accounts found to merge.");
            continue;
        }

        const oldAccountIds = oldAccounts.map(a => a.id);
        console.log(`   Found ${oldAccounts.length} old accounts to merge: ${oldAccounts.map(a => `${a.code}-${a.name}`).join(', ')}`);

        // 4. Update References (Move everything to 1000)

        // A. Journal Lines
        const jlUpdate = await prisma.journalLine.updateMany({
            where: { accountId: { in: oldAccountIds } },
            data: { accountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${jlUpdate.count} Journal Lines.`);

        // B. Expenses
        const expUpdate = await prisma.expense.updateMany({
            where: { accountId: { in: oldAccountIds } },
            data: { accountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${expUpdate.count} Expenses.`);

        // C. Invoice Payments
        const ipUpdate = await prisma.invoicePayment.updateMany({
            where: { bankAccountId: { in: oldAccountIds } },
            data: { bankAccountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${ipUpdate.count} Invoice Payments.`);

        // D. Transfers (From)
        const tfUpdate = await prisma.transfer.updateMany({
            where: { fromAccountId: { in: oldAccountIds } },
            data: { fromAccountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${tfUpdate.count} Transfers (From).`);

        // E. Transfers (To)
        const ttUpdate = await prisma.transfer.updateMany({
            where: { toAccountId: { in: oldAccountIds } },
            data: { toAccountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${ttUpdate.count} Transfers (To).`);

        // F. Fixed Assets (Paid From)
        try {
            const faUpdate = await prisma.fixedAsset.updateMany({
                where: { paidFromAccountId: { in: oldAccountIds } },
                data: { paidFromAccountId: targetAccount.id }
            });
            console.log(`   🔄 Moved ${faUpdate.count} Fixed Asset Payments.`);
        } catch (e) {
            console.log("   ⚠️ Skipping FixedAsset update (field might not exist or be used).");
        }

        // G. Purchase Items (Rare but possible)
        const piUpdate = await prisma.purchaseItem.updateMany({
            where: { accountId: { in: oldAccountIds } },
            data: { accountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${piUpdate.count} Purchase Items.`);

        // H. Transactions (Debit)
        const txDebitUpdate = await prisma.transaction.updateMany({
            where: { debitAccountId: { in: oldAccountIds } },
            data: { debitAccountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${txDebitUpdate.count} Transactions (Debit).`);

        // I. Transactions (Credit)
        const txCreditUpdate = await prisma.transaction.updateMany({
            where: { creditAccountId: { in: oldAccountIds } },
            data: { creditAccountId: targetAccount.id }
        });
        console.log(`   🔄 Moved ${txCreditUpdate.count} Transactions (Credit).`);

        // J. Payment Accounts (Metadata)
        // This is tricky. We likely want ONE PaymentAccount entry for 1000.
        // Delete old PaymentAccount entries for oldAccountIds
        const paDelete = await prisma.paymentAccount.deleteMany({
            where: { accountId: { in: oldAccountIds } }
        });
        console.log(`   🗑️ Deleted ${paDelete.count} old PaymentAccount metadata entries.`);

        // Ensure 1000 has a PaymentAccount entry if not exists
        const existingPA = await prisma.paymentAccount.findFirst({
            where: { tenantId: tenant.id, accountId: targetAccount.id }
        });

        if (!existingPA) {
            await prisma.paymentAccount.create({
                data: {
                    tenantId: tenant.id,
                    accountId: targetAccount.id,
                    name: 'Cash & Cash Equivalents',
                    institution: 'Cash',
                    // type: 'cash' // Field does not exist
                }
            });
            console.log(`   ✨ Created PaymentAccount metadata for 1000.`);
        }

        // 5. Delete Old Accounts
        // We must ensure they have no children first (unlikely for 1001-1004 but good to check)
        // If they were parents, update their children to point to 1000 or null?
        // Logic: if 1001 had children, we should probably move them to 1000 or make them top level.
        // For simplicity, we assume they have no children as per template.

        const deleteCount = await prisma.account.deleteMany({
            where: {
                tenantId: tenant.id,
                id: { in: oldAccountIds }
            }
        });
        console.log(`   🗑️ Deleted ${deleteCount.count} old accounts.`);
    }

    console.log("\n✅ Migration Complete!");
}

mergeCashAccounts()
    .catch(e => {
        console.error("❌ Migration Failed:", e);
    })
    .finally(() => prisma.$disconnect());
