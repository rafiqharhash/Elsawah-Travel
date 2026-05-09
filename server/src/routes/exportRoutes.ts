import express from 'express';
import { exportTripBookings, exportTripPDF } from '../controllers/exportController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect, authorize('Admin', 'Supervisor'));

// PDF trip sheet — works for any trip status
router.get('/trip/:tripId/pdf', exportTripPDF);

// Excel / CSV export
router.get('/trip/:tripId', exportTripBookings);

export default router;
