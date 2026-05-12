import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    { id: user.id, email: user.email },
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
    { id: admin.id, email: admin.email, isAdmin: true },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Export individual functions (named exports)
export {
  verifyJWT,
  verifyAdminJWT,
  generateToken,
  generateRefreshToken,
  generateAdminToken,
  generateAdminRefreshToken,
  JWT_SECRET,
};