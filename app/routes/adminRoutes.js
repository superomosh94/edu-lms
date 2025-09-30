const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole(['Admin', 'Super Admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// System management
router.get('/stats', adminController.getSystemStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/reports', adminController.generateReport);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/add', adminController.showAddUserForm);
router.post('/users/add', validationMiddleware.validateUserCreate, adminController.addUser);
router.get('/users/:id/edit', adminController.showEditUserForm);
router.put('/users/:id', validationMiddleware.validateUserUpdate, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Course management
router.get('/courses', adminController.getAllCourses); // Added route
router.get('/courses/add', adminController.showAddCourseForm);
router.post('/courses/add', validationMiddleware.validateCourseCreate, adminController.addCourse);
router.put('/courses/:id/moderate', validationMiddleware.validateCourseModeration, adminController.moderateCourse);

module.exports = router;
