"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tripController_1 = require("../controllers/tripController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public: students need to list/view trips to book
router.get('/', tripController_1.getTrips);
router.get('/:id', tripController_1.getTrip);
// Admin + Supervisor: full trip management
router.post('/', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), tripController_1.createTrip);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), tripController_1.updateTrip);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), tripController_1.deleteTrip);
// Supervisor only: force-cancel a trip even when it has bookings
router.patch('/:id/cancel', auth_1.protect, (0, auth_1.authorize)('Supervisor'), tripController_1.cancelTrip);
// Admin + Supervisor: publish/unpublish a trip sheet for students
router.patch('/:id/publish', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), tripController_1.publishTrip);
exports.default = router;
