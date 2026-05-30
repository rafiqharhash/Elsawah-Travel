import express from 'express';
import {
  getLocations,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public: students fetch active locations on load
router.get('/', getLocations);

// Admin: fetch all including inactive
router.get('/all', protect, authorize('Admin', 'Supervisor'), getAllLocations);

// Admin CRUD
router.post('/',    protect, authorize('Admin', 'Supervisor'), createLocation);
router.put('/:id',  protect, authorize('Admin', 'Supervisor'), updateLocation);
router.delete('/:id', protect, authorize('Admin', 'Supervisor'), deleteLocation);

export default router;
