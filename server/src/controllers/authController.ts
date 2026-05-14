import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password, role } = req.body;

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    return next(new AppError('Phone number already registered', 400));
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'Student',
  });

  const token = signToken(user._id.toString());

  sendResponse(res, 201, true, 'User registered successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  // Support login via username only for Admins/Supervisors
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide a username and password', 400));
  }

  // Explicitly select password since it is hidden by default in schema
  const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');

  logger.debug(`Login attempt for username: "${username}"`);
  
  if (!user || !user.password || !(await user.comparePassword(password))) {
    logger.debug(`Login failed for username: "${username}"`);
    return next(new AppError('Incorrect credentials', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated', 403));
  }

  const token = signToken(user._id.toString());

  sendResponse(res, 200, true, 'Logged in successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  sendResponse(res, 200, true, 'User details retrieved', user);
};
