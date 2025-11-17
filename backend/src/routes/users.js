const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT } = require('../middleware/auth');

// Protect all user routes with JWT
router.use(verifyJWT);

router.get('/', userController.listUsers);
router.post('/', userController.createUser);

module.exports = router;
