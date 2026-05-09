import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  route: string;
  date: Date;
  departureTime: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  vehicleIds: mongoose.Types.ObjectId[]; // Assigned fleet vehicles
  locationTimes?: { location: string; time: string }[];
  totalCapacity: number;
  totalBooked: number;
  totalIncome: number;
  occupancyPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    route: { type: String, required: true },
    date: { type: Date, required: true },
    departureTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    vehicleIds: [{ type: Schema.Types.ObjectId, ref: 'Vehicle', default: [] }],
    locationTimes: [
      {
        location: { type: String, required: true },
        time: { type: String, required: true },
      }
    ],
    totalCapacity: { type: Number, default: 0 },
    totalBooked: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tripSchema.virtual('occupancyPercentage').get(function () {
  if (this.totalCapacity === 0) return 0;
  return Math.round((this.totalBooked / this.totalCapacity) * 100);
});

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
