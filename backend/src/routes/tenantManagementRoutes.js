import { Router } from 'express';
import {
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant,
    getPlatformStats
} from '../controllers/tenantManagementController.js';

const router = Router();

/**
 * Platform Admin Tenant Management Routes
 * Security: These routes are expected to be protected by verifyAdminJWT at the entry point
 */

// Global stats
router.get('/stats', getPlatformStats);

// Tenant CRUD
router.get('/', getAllTenants);
router.get('/:id', getTenantById);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

export default router;
