"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const studentController_1 = require("../controllers/studentController");
const router = (0, express_1.Router)();
// All routes require a valid student JWT
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('Student'));
router.get('/me', studentController_1.getMyProfile);
router.patch('/me', studentController_1.updateMyProfile);
router.get('/my-bookings', studentController_1.getMyBookings);
exports.default = router;
