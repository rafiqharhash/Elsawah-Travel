import express from 'express';
import {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  cancelTrip,
  publishTrip,
} from '../controllers/tripController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public: students need to list/view trips to book
router.get('/', getTrips);
router.get('/:id', getTrip);

// Admin + Supervisor: full trip management
router.post('/',    protect, authorize('Admin', 'Supervisor'), createTrip);
router.put('/:id',  protect, authorize('Admin', 'Supervisor'), updateTrip);
router.delete('/:id', protect, authorize('Admin', 'Supervisor'), deleteTrip);

// Supervisor only: force-cancel a trip even when it has bookings
router.patch('/:id/cancel', protect, authorize('Supervisor'), cancelTrip);

// Admin + Supervisor: publish/unpublish a trip sheet for students
router.patch('/:id/publish', protect, authorize('Admin', 'Supervisor'), publishTrip);

export default router;
