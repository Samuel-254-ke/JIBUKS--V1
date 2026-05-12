import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configuration
const ADMIN_EMAIL = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'admin@jibuks.com';
const ADMIN_PASSWORD = process.argv[3] || 'admin123';
const ADMIN_NAME = process.argv[4] || 'System Admin';

async function main() {
    console.log('🚀 Starting Admin Creation Script...');
    console.log(`📧 Target Email: ${ADMIN_EMAIL}`);
    console.log(`👤 Target Name: ${ADMIN_NAME}`);

    let admin;
    try {
        // 1. Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: ADMIN_EMAIL }
        });

        if (existingAdmin) {
            console.log('⚠️ Admin already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            admin = await prisma.admin.update({
                where: { email: ADMIN_EMAIL },
                data: {
                    password: hashedPassword,
                    name: ADMIN_NAME,
                    isActive: true
                }
            });
            console.log('✅ Admin updated successfully.');
        } else {
            // 2. Hash password
            console.log('🔐 Hashing password...');
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

            // 3. Create Admin
            console.log('📝 Creating admin record...');
            admin = await prisma.admin.create({
                data: {
                    email: ADMIN_EMAIL,
                    password: hashedPassword,
                    name: ADMIN_NAME,
                    isSuperAdmin: true,
                    isActive: true,
                    organization: 'JIBUKS Headquarters'
                }
            });
            console.log('✨ Admin created successfully!');
        }
        console.log('---------------------------');
        console.log(`ID: ${admin.id}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log(`Name: ${admin.name}`);
        console.log('---------------------------');
        console.log('You can now log in with these credentials.');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
