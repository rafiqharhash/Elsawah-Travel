"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exportController_1 = require("../controllers/exportController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'));
// PDF trip sheet — works for any trip status
router.get('/trip/:tripId/pdf', exportController_1.exportTripPDF);
// Excel / CSV export
router.get('/trip/:tripId', exportController_1.exportTripBookings);
exports.default = router;
