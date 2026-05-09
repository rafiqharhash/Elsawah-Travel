import express from 'express';
import {
  createBooking,
  getBookings,
  confirmBooking,
  rejectBooking,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';
import { paymentUpload } from '../middleware/upload';

const router = express.Router();

// Public: students submit booking with payment screenshot
router.post('/', paymentUpload.single('paymentScreenshot'), createBooking);

// Admin / Supervisor: list all bookings (filterable by status=Pending)
router.get('/', protect, authorize('Admin', 'Supervisor'), getBookings);

// Admin / Supervisor: confirm or reject a pending booking
router.patch('/:id/confirm', protect, authorize('Admin', 'Supervisor'), confirmBooking);
router.patch('/:id/reject',  protect, authorize('Admin', 'Supervisor'), rejectBooking);

export default router;
