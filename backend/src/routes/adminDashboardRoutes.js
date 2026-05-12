import { Router } from 'express';
import {
  getDashboardSummary,
  getActiveSessionsCount,
  getRevenueByMonth,
  getRecentUsers,
  getAnalyticsTraffic,
  getAnalyticsKpis,
  getAnalyticsReferrers,
  getAnalyticsDevices,
} from '../controllers/adminDashboardController.js';

const router = Router();

router.get('/summary', getDashboardSummary);
router.get('/active-sessions', getActiveSessionsCount);
router.get('/revenue-by-month', getRevenueByMonth);
router.get('/recent-users', getRecentUsers);
router.get('/analytics/traffic', getAnalyticsTraffic);
router.get('/analytics/kpis', getAnalyticsKpis);
router.get('/analytics/referrers', getAnalyticsReferrers);
router.get('/analytics/devices', getAnalyticsDevices);

export default router;
