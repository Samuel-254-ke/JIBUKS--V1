import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCurrentTenant() {
    try {
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log('❌ No tenant found');
            return;
        }

        console.log(`\n🌱 Seeding VAT Rates and Suppliers for: ${tenant.name}\n`);
        console.log('='.repeat(60));

        // Seed VAT Rates
        console.log('\n📊 Seeding VAT Rates...');
        const vatRates = [
            {
                name: 'Standard VAT (16%)',
                code: 'S',
                rate: 16.0,
                description: 'Standard VAT rate in Kenya',
                isActive: true
            },
            {
                name: 'Zero Rated (0%)',
                code: 'Z',
                rate: 0.0,
                description: 'Zero-rated supplies (exports, certain foodstuffs)',
                isActive: true
            },
            {
                name: 'Exempt',
                code: 'EXEMPT',
                rate: 0.0,
                description: 'Exempt supplies (financial services, education, healthcare)',
                isActive: true
            }
        ];

        let vatCreated = 0;
        for (const vat of vatRates) {
            const existing = await prisma.vatRate.findFirst({
                where: { tenantId: tenant.id, code: vat.code }
            });

            if (!existing) {
                await prisma.vatRate.create({
                    data: { tenantId: tenant.id, ...vat }
                });
                console.log(`   ✅ Created: ${vat.name}`);
                vatCreated++;
            } else {
                console.log(`   ⏭️  Exists: ${vat.name}`);
            }
        }

        console.log(`\n📊 VAT Rates: ${vatCreated} created, ${vatRates.length - vatCreated} already existed\n`);

        // Seed Default Suppliers
        console.log('📦 Seeding Default Suppliers...');
        const suppliers = [
            {
                name: 'Sample Supplier 1',
                email: 'supplier1@example.com',
                phone: '+254700000001',
                address: 'Nairobi, Kenya',
                paymentTerms: 'NET_30',
                balance: 0,
                isActive: true
            },
            {
                name: 'Sample Supplier 2',
                email: 'supplier2@example.com',
                phone: '+254700000002',
                address: 'Mombasa, Kenya',
                paymentTerms: 'NET_30',
                balance: 0,
                isActive: true
            },
            {
                name: 'Kenya Power (KPLC)',
                email: 'info@kplc.co.ke',
                phone: '+254703070707',
                address: 'Nairobi, Kenya',
                paymentTerms: 'DUE_ON_RECEIPT',
                balance: 0,
                isActive: true
            },
            {
                name: 'Safaricom PLC',
                email: 'care@safaricom.co.ke',
                phone: '+254722000000',
                address: 'Nairobi, Kenya',
                paymentTerms: 'DUE_ON_RECEIPT',
                balance: 0,
                isActive: true
            }
        ];

        let suppliersCreated = 0;
        for (const supplier of suppliers) {
            let vendor = await prisma.vendor.findFirst({
                where: { tenantId: tenant.id, email: supplier.email }
            });

            if (!vendor) {
                vendor = await prisma.vendor.create({
                    data: { tenantId: tenant.id, ...supplier }
                });
                console.log(`   ✅ Created: ${supplier.name}`);
                suppliersCreated++;
            } else {
                console.log(`   ⏭️  Exists: ${supplier.name}`);
            }

            // Create a sample Expense for history (for autofill)
            // This ensures the new autofill feature works immediately
            const lastExp = await prisma.expense.findFirst({
                where: { tenantId: tenant.id, vendorId: vendor.id }
            });

            if (!lastExp) {
                // Determine a logical default account
                let defaultAccountCode = '5000'; // General Expense
                if (vendor.name.includes('Power')) defaultAccountCode = '5030'; // Utilities
                if (vendor.name.includes('Safaricom')) defaultAccountCode = '5030'; // Utilities/Comms

                const account = await prisma.account.findFirst({
                    where: { tenantId: tenant.id, code: defaultAccountCode }
                });

                if (account) {
                    await prisma.expense.create({
                        data: {
                            tenantId: tenant.id,
                            vendorId: vendor.id,
                            expenseNumber: `INIT-${vendor.id}`,
                            amount: 1000,
                            totalAmount: 1160,
                            vatAmount: 160,
                            category: account.name,
                            accountId: account.id,
                            date: new Date(),
                            paymentMethod: 'Cash',
                            description: 'Initial balance / Seeded history'
                        }
                    });
                    console.log(`      💡 Added sample history for ${vendor.name}`);
                }
            }
        }

        console.log(`\n📦 Suppliers: ${suppliersCreated} created, ${suppliers.length - suppliersCreated} already existed\n`);
        console.log('='.repeat(60));
        console.log('\n✅ Seeding Complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedCurrentTenant();
