"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Public: students submit booking with payment screenshot
router.post('/', upload_1.paymentUpload.single('paymentScreenshot'), bookingController_1.createBooking);
// Admin / Supervisor: list all bookings (filterable by status=Pending)
router.get('/', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), bookingController_1.getBookings);
// Admin / Supervisor: confirm or reject a pending booking
router.patch('/:id/confirm', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), bookingController_1.confirmBooking);
router.patch('/:id/reject', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), bookingController_1.rejectBooking);
exports.default = router;
