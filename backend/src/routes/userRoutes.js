"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('Admin', 'Supervisor'));
// All admins and supervisors can view and update users
router.route('/').get(userController_1.getUsers);
router.route('/:id').put(userController_1.updateUser);
// Supervisor-only: admin management
router.route('/admins').post((0, auth_1.authorize)('Supervisor'), userController_1.createAdmin);
router.route('/admins/:id').delete((0, auth_1.authorize)('Supervisor'), userController_1.removeAdmin);
// Admin + Supervisor: manual booking on behalf of students
router.route('/manual-booking').post((0, auth_1.authorize)('Admin', 'Supervisor'), userController_1.manualBooking);
exports.default = router;
