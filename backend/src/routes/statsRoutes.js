"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('Admin', 'Supervisor'));
router.get('/dashboard', statsController_1.getDashboardStats);
exports.default = router;
