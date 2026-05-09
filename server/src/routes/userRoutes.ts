import express from 'express';
import { getUsers, createAdmin, removeAdmin, manualBooking, updateUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'Supervisor'));

// All admins and supervisors can view and update users
router.route('/').get(getUsers);
router.route('/:id').put(updateUser);

// Supervisor-only: admin management
router.route('/admins').post(authorize('Supervisor'), createAdmin);
router.route('/admins/:id').delete(authorize('Supervisor'), removeAdmin);

// Admin + Supervisor: manual booking on behalf of students
router.route('/manual-booking').post(authorize('Admin', 'Supervisor'), manualBooking);

export default router;
