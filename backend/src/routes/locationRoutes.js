"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/locationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public: students fetch active locations on load
router.get('/', locationController_1.getLocations);
// Admin: fetch all including inactive
router.get('/all', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), locationController_1.getAllLocations);
// Admin CRUD
router.post('/', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), locationController_1.createLocation);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), locationController_1.updateLocation);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('Admin', 'Supervisor'), locationController_1.deleteLocation);
exports.default = router;
