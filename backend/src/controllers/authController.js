const db = require('../db');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

/**
 * Local login with email/password (fallback)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, tenant_id: user.tenant_id },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Auth0 callback handler
 * In production, Auth0 will redirect to /auth/callback with a code
 */
async function auth0Callback(req, res, next) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // In a real setup, exchange code for tokens from Auth0
    // For now, this is a placeholder
    res.json({ message: 'Auth0 callback received. Exchange code for tokens in production.' });
  } catch (err) {
    next(err);
  }
}

/**
 * OAuth2 login/signup endpoint (Auth0 profile exchange)
 * Call this after receiving Auth0 ID token from mobile app
 */
async function oauth2Login(req, res, next) {
  try {
    const { auth0_id, email, name, tenant_id } = req.body;
    if (!auth0_id || !email) {
      return res.status(400).json({ error: 'auth0_id and email required' });
    }

    // Try to find existing user with auth0_id
    let result = await db.query('SELECT * FROM users WHERE auth0_id = $1', [auth0_id]);
    
    if (result.rows.length > 0) {
      // User exists, return token
      const user = result.rows[0];
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      return res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, tenant_id: user.tenant_id },
      });
    }

    // Create new user (auto-signup)
    // If no tenant_id provided, create or use default tenant
    let finalTenantId = tenant_id;
    if (!finalTenantId) {
      // Create a default tenant for this user
      const tenantResult = await db.query(
        'INSERT INTO tenants(name, slug, owner_email) VALUES($1, $2, $3) RETURNING id',
        [email.split('@')[0], email.split('@')[0], email]
      );
      finalTenantId = tenantResult.rows[0].id;
    }

    const insertResult = await db.query(
      'INSERT INTO users(tenant_id, email, name, auth0_id) VALUES($1, $2, $3, $4) RETURNING *',
      [finalTenantId, email, name || email, auth0_id]
    );

    const user = insertResult.rows[0];
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, tenant_id: user.tenant_id },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'User already exists' });
    }
    next(err);
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken required' });
    }

    // In production, verify refresh token and check blacklist
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      const newAccessToken = generateToken(user);

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user from JWT
 */
async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await db.query(
      'SELECT id, email, name, auth0_id, tenant_id, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * Logout (invalidate refresh token in production)
 */
async function logout(req, res, next) {
  try {
    // In production, add refreshToken to blacklist
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  oauth2Login,
  auth0Callback,
  refreshToken,
  getCurrentUser,
  logout,
};
