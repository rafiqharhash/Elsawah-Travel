import express from 'express';
import { register, login, getMe } from '../controllers/authController';
import { registerStudent, loginStudent } from '../controllers/studentController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Admin / Supervisor auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Student auth
router.post('/student/register', registerStudent);
router.post('/student/login',    loginStudent);

export default router;
