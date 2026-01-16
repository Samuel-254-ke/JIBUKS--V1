/**
 * Script to seed categories for existing families
 * Run this if you have an existing family that doesn't have categories yet
 * 
 * Usage: node scripts/seedCategories.js
 */

import { prisma } from '../src/lib/prisma.js';
import { seedFamilyCategories } from '../src/services/accountingService.js';

async function main() {
    try {
        console.log('🌱 Starting category seeding for all families...\n');

        // Get all tenants
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        categories: true
                    }
                }
            }
        });

        console.log(`Found ${tenants.length} families\n`);

        for (const tenant of tenants) {
            console.log(`Processing family: ${tenant.name} (ID: ${tenant.id})`);
            
            if (tenant._count.categories > 0) {
                console.log(`  ⏭️  Already has ${tenant._count.categories} categories, skipping\n`);
                continue;
            }

            try {
                const count = await seedFamilyCategories(tenant.id);
                console.log(`  ✅ Seeded ${count} categories\n`);
            } catch (error) {
                console.error(`  ❌ Error seeding categories:`, error.message, '\n');
            }
        }

        console.log('✨ Category seeding complete!');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

