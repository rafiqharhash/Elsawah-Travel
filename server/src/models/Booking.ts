import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  referenceId: string;
  studentName: string;
  studentPhone: string;
  studentId?: mongoose.Types.ObjectId;   // linked when booking from student portal
  pickupLocation: string;
  pickupAddress: string;
  dropoffLocation: string;
  tripId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  // ── Multi-seat fields (new) ──────────────────────────────
  seatNumbers: number[];     // all reserved seat numbers
  seatCount: number;         // convenience count
  pricePerSeat: number;      // price for one seat at this pickup
  amount: number;            // total = pricePerSeat × seatCount
  // ── Legacy (kept for backward compat) ────────────────────
  seatNumber?: number;       // old single-seat field — still in old docs
  paymentScreenshot: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    referenceId:    { type: String,   required: true, unique: true },
    studentName:    { type: String,   required: true },
    studentPhone:   { type: String,   required: true },
    studentId:      { type: Schema.Types.ObjectId, ref: 'User', index: true },
    pickupLocation: { type: String,   required: true },
    pickupAddress:  { type: String,   required: true },
    dropoffLocation:{ type: String,   required: true },
    tripId:         { type: Schema.Types.ObjectId, ref: 'Trip',    required: true, index: true },
    vehicleId:      { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },

    // New multi-seat fields — NOT required so old documents still load
    seatNumbers:    { type: [Number], default: undefined },
    seatCount:      { type: Number,   default: 1 },
    pricePerSeat:   { type: Number,   default: 0 },
    amount:         { type: Number,   required: true },

    // Legacy field — do NOT mark required
    seatNumber:     { type: Number },

    paymentScreenshot: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: false,          // allow legacy fields on documents without errors
  },
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
