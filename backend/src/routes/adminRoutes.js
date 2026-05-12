import express from 'express';
import { register, login, getCurrentAdmin, logout } from '../controllers/adminController.js';
import { verifyAdminJWT } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', verifyAdminJWT, logout);
router.get('/me', verifyAdminJWT, getCurrentAdmin);

export default router;
