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
exports.Trip = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tripSchema = new mongoose_1.Schema({
    route: { type: String, required: true },
    date: { type: Date, required: true },
    departureTime: { type: String, required: true },
    status: {
        type: String,
        enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
        default: 'Scheduled',
    },
    vehicleIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Vehicle', default: [] }],
    locationTimes: [
        {
            location: { type: String, required: true },
            time: { type: String, required: true },
        }
    ],
    totalCapacity: { type: Number, default: 0 },
    totalBooked: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
tripSchema.virtual('occupancyPercentage').get(function () {
    if (this.totalCapacity === 0)
        return 0;
    return Math.round((this.totalBooked / this.totalCapacity) * 100);
});
exports.Trip = mongoose_1.default.model('Trip', tripSchema);
