import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: {
        tenantId: req.user.tenantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenantType: true
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

/**
 * Get ALL users in the database (unfiltered - for Super Admin/Testing)
 */
async function listAllUsersDatabase(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenantType: true
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashed,
        tenantId: tenantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    // Unique constraint violation (Prisma code P2002)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'email already exists' });
    }
    next(err);
  }
}

/**
 * PATCH /api/users/me/presence — updates lastSeenAt for the authenticated tenant user.
 * Used by mobile/web clients so Super Admin "Active now" reflects real usage.
 */
async function touchPresence(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });

    res.json({ ok: true, lastSeenAt: now.toISOString() });
  } catch (err) {
    next(err);
  }
}

export { listUsers, createUser, listAllUsersDatabase, touchPresence };
