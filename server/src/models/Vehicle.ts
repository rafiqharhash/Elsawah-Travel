import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: { type: String, required: true, unique: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    capacity: { type: Number, default: 14 },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
