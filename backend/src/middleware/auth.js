import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set.');
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token from Authorization header
 * Expected format: Authorization: Bearer <token>
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    req.user = decoded; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to verify Admin JWT token from Authorization header
 */
function verifyAdminJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header for admin' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.admin = decoded; // Attach admin to request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

/**
 * Middleware to reject requests whose authenticated user has no tenantId.
 * Defense in depth: without this, a Prisma `where: { tenantId }` with
 * tenantId === undefined silently drops the filter and can return
 * cross-tenant data. Use after verifyJWT.
 */
function requireTenant(req, res, next) {
  if (!req.user?.tenantId) {
    return res.status(400).json({ error: 'tenantId is required' });
  }
  next();
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      auth0Id: user.auth0Id,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Generate refresh token (longer expiry)
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Generate JWT token for an admin
 */
function generateAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      isAdmin: true,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Generate refresh token for an admin
 */
function generateAdminRefreshToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, isAdmin: true, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Export individual functions (named exports)
export {
  verifyJWT,
  verifyAdminJWT,
  requireTenant,
  generateToken,
  generateRefreshToken,
  generateAdminToken,
  generateAdminRefreshToken,
  JWT_SECRET,
};