import bcrypt from 'bcrypt';
import { generateAdminToken, generateAdminRefreshToken, JWT_SECRET } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const SALT_ROUNDS = process.env.NODE_ENV === 'production' ? 10 : 6;

/**
 * Register a new admin (can be restricted or protected in production)
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, organization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        organization
      },
    });

    const accessToken = generateAdminToken(admin);
    const refreshToken = generateAdminRefreshToken(admin);

    res.status(201).json({
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        organization: admin.organization
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin Login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or account disabled' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAdminToken(admin);
    const refreshToken = generateAdminRefreshToken(admin);

    res.json({
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        organization: admin.organization
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current logged-in admin
 */
async function getCurrentAdmin(req, res, next) {
  try {
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Not authenticated as admin' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        organization: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (err) {
    next(err);
  }
}

/**
 * Logout
 */
async function logout(req, res, next) {
  try {
    // Client-side mostly removes the token. In DB, could blacklist refresh tokens.
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export {
  register,
  login,
  getCurrentAdmin,
  logout
};
