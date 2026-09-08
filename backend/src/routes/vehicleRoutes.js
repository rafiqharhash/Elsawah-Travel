"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vehicleController_1 = require("../controllers/vehicleController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All authenticated Admins and Supervisors can access vehicle routes
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('Admin', 'Supervisor'));
router.route('/')
    .get(vehicleController_1.getVehicles)
    .post(vehicleController_1.createVehicle); // Supervisor can add vehicles
router.route('/:id')
    .get(vehicleController_1.getVehicle)
    .put(vehicleController_1.updateVehicle) // Supervisor can edit vehicles
    .delete(vehicleController_1.deleteVehicle); // Supervisor can remove vehicles
exports.default = router;
