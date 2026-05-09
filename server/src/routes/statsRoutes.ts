import express from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'Supervisor'));

router.get('/dashboard', getDashboardStats);

export default router;
