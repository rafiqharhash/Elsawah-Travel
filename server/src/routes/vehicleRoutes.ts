import express from 'express';
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All authenticated Admins and Supervisors can access vehicle routes
router.use(protect);
router.use(authorize('Admin', 'Supervisor'));

router.route('/')
  .get(getVehicles)
  .post(createVehicle);       // Supervisor can add vehicles

router.route('/:id')
  .get(getVehicle)
  .put(updateVehicle)         // Supervisor can edit vehicles
  .delete(deleteVehicle);     // Supervisor can remove vehicles

export default router;
