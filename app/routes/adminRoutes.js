const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// All admin routes require admin role
router.use(authMiddleware.authenticate);
router.use(roleMiddleware.restrictTo('admin'));

// System management
router.get('/stats', adminController.getSystemStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/reports', adminController.generateReport);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', 
    validationMiddleware.validateUserUpdate,
    adminController.updateUser
);
router.delete('/users/:id', adminController.deleteUser);

// Course management
router.put('/courses/:id/moderate', 
    validationMiddleware.validateCourseModeration,
    adminController.moderateCourse
);

module.exports = router;