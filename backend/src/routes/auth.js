const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/oauth2-login', authController.oauth2Login);
router.get('/auth0/callback', authController.auth0Callback);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', verifyJWT, authController.getCurrentUser);

module.exports = router;
