import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  username?: string;
  email?: string;
  phone: string;
  password?: string;
  role: 'Student' | 'Admin' | 'Supervisor';
  isActive: boolean;
  // ── Student-specific fields ────────────────────────────────
  studentNumber?: string;   // university student ID
  relativePhone?: string;   // parent/guardian contact
  // ──────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email:    { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone:    { type: String, required: true, unique: true },
    password: { type: String, select: false },   // excluded from queries by default
    role: {
      type: String,
      enum: ['Student', 'Admin', 'Supervisor'],
      default: 'Student',
    },
    isActive: { type: Boolean, default: true },
    // Student-specific
    studentNumber: { type: String, unique: true, sparse: true },
    relativePhone: { type: String },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
