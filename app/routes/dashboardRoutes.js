const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All dashboard routes require authentication
router.use(authMiddleware.authenticate);

// Main dashboard
router.get('/', dashboardController.getDashboard);

// Admin dashboard (admin only)
router.get('/admin', 
    roleMiddleware.restrictTo('Admin'),
    dashboardController.showAdminDashboard
);

// Teacher dashboard (teacher only)
router.get('/teacher', 
    roleMiddleware.restrictTo('Teacher'),
    dashboardController.showTeacherDashboard
);

// Student dashboard (student only)
router.get('/student', 
    roleMiddleware.restrictTo('Student'),
    dashboardController.showStudentDashboard
);

module.exports = router;
