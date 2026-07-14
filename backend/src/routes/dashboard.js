import { Router } from 'express';
import { verifyJWT, requireTenant } from '../middleware/auth.js';
import { getBusinessDashboard } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require authentication
router.use(verifyJWT);
router.use(requireTenant);

router.get('/business', getBusinessDashboard);

export default router;
