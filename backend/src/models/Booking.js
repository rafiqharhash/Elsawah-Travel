"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bookingSchema = new mongoose_1.Schema({
    referenceId: { type: String, required: true, unique: true },
    studentName: { type: String, required: true },
    studentPhone: { type: String, required: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    pickupLocation: { type: String, required: true },
    pickupAddress: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    tripId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    vehicleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    // New multi-seat fields — NOT required so old documents still load
    seatNumbers: { type: [Number], default: undefined },
    seatCount: { type: Number, default: 1 },
    pricePerSeat: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    // Legacy field — do NOT mark required
    seatNumber: { type: Number },
    paymentScreenshot: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled'],
        default: 'Pending',
    },
    confirmedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
}, {
    timestamps: true,
    strict: false, // allow legacy fields on documents without errors
});
exports.Booking = mongoose_1.default.model('Booking', bookingSchema);
