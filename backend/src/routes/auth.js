import { Router } from 'express';
const router = Router();
import { login, oauth2Login, auth0Callback, refreshToken, logout, getCurrentUser } from '../controllers/authController.js';
import { verifyJWT } from '../middleware/auth.js';

// Public routes
router.post('/login', login);
router.post('/oauth2-login', oauth2Login);
router.get('/auth0/callback', auth0Callback);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyJWT, getCurrentUser);

export default router;
