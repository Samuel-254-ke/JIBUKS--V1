import { Router } from 'express';
const router = Router();
import { listUsers, createUser, listAllUsersDatabase, touchPresence } from '../controllers/userController.js';
import { verifyJWT } from '../middleware/auth.js';

// Protect all user routes with JWT
router.use(verifyJWT);

router.patch('/me/presence', touchPresence);
router.get('/', listUsers);
router.get('/all', listAllUsersDatabase);
router.post('/', createUser);

export default router;
