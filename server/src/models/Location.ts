import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  arabicName: string;
  type: 'pickup' | 'dropoff';
  fare: number; // EGP per seat — relevant for pickups; 0 for dropoffs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name:       { type: String, required: true, unique: true, trim: true },
    arabicName: { type: String, default: '', trim: true },
    type:       { type: String, enum: ['pickup', 'dropoff'], required: true },
    fare:       { type: Number, default: 0, min: 0 },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Location = mongoose.model<ILocation>('Location', locationSchema);
