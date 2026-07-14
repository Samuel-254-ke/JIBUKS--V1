import { Router } from 'express';
const router = Router();
import { login, register, refreshToken, logout, getCurrentUser, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import { verifyJWT } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

// Public routes
router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', verifyJWT, getCurrentUser);

export default router;
