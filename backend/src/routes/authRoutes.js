"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const studentController_1 = require("../controllers/studentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin / Supervisor auth
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/me', auth_1.protect, authController_1.getMe);
// Student auth
router.post('/student/register', studentController_1.registerStudent);
router.post('/student/login', studentController_1.loginStudent);
exports.default = router;
