import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const SALT_ROUNDS = process.env.NODE_ENV === 'production' ? 10 : 6;

/**
 * Register a new Platform Admin
 * Strictly limited to AUTHORIZED_EMAIL from .env
 */
export async function register(req, res, next) {
    try {
        const { name, email, password, confirmPassword } = req.body;
        const AUTHORIZED_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'apbcafricait@gmail.com';

        // 1. Validate authorized email
        if (email !== AUTHORIZED_EMAIL) {
            return res.status(403).json({
                error: 'Only the designated platform administrator can register an account.'
            });
        }

        // 2. Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // 3. Check if admin already exists
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'A platform admin already exists with this email' });
        }

        // 4. Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 5. Create Platform Admin
        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isSuperAdmin: true, // First one is implicitly super admin
            },
        });

        // 6. Generate tokens
        const accessToken = generateToken({
            id: admin.id,
            email: admin.email,
            isPlatformAdmin: true,
            name: admin.name
        });
        const refreshToken = generateRefreshToken({ id: admin.id, email: admin.email });

        res.status(201).json({
            accessToken,
            refreshToken,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                isPlatformAdmin: true
            },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Login for Platform Admin
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid platform credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid platform credentials' });
        }

        const accessToken = generateToken({
            id: admin.id,
            email: admin.email,
            isPlatformAdmin: true,
            name: admin.name
        });
        const refreshToken = generateRefreshToken({ id: admin.id, email: admin.email });

        res.json({
            accessToken,
            refreshToken,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                isPlatformAdmin: true
            },
        });
    } catch (err) {
        next(err);
    }
}
