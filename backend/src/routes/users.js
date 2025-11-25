import { Router } from 'express';
const router = Router();
import { listUsers, createUser } from '../controllers/userController.js';
import { verifyJWT } from '../middleware/auth.js';

// Protect all user routes with JWT
router.use(verifyJWT);

router.get('/', listUsers);
router.post('/', createUser);

export default router;
