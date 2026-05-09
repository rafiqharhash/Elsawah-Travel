import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getMyProfile,
  getMyBookings,
  updateMyProfile,
} from '../controllers/studentController';

const router = Router();

// All routes require a valid student JWT
router.use(protect);
router.use(authorize('Student'));

router.get('/me',           getMyProfile);
router.patch('/me',         updateMyProfile);
router.get('/my-bookings',  getMyBookings);

export default router;
