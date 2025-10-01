const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Authentication & role check
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole(['Admin', 'Super Admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// System management
router.get('/system', adminController.getSystemOverview);
router.get('/settings', adminController.showSettings);
router.post(
    '/settings',
    validationMiddleware.validateSettingsUpdate || ((req, res, next) => next()),
    adminController.updateSettings
);

router.get('/stats', adminController.getSystemStatsPage);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/reports', adminController.generateReport);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/add', adminController.showAddUserForm);
router.post(
    '/users/add',
    validationMiddleware.validateUserCreate || ((req, res, next) => next()),
    adminController.addUser
);
router.get('/users/:id/edit', adminController.showEditUserForm); // Edit form

// PUT route for updating user
router.put(
    '/users/:id',
    validationMiddleware.validateUserUpdate || ((req, res, next) => next()),
    adminController.updateUser
);

router.post('/users/delete/:id', adminController.deleteUser);

// Course management
router.get('/courses', adminController.getAllCourses);
router.get('/courses/add', adminController.showAddCourseForm);
router.post(
    '/courses/add',
    validationMiddleware.validateCourseCreate || ((req, res, next) => next()),
    adminController.addCourse
);
router.post(
    '/courses/moderate/:id',
    validationMiddleware.validateCourseModeration || ((req, res, next) => next()),
    adminController.moderateCourse
);
router.post('/courses/delete/:id', adminController.deleteCourse);

// Announcements management
router.get('/announcements', adminController.getAnnouncements);
router.get('/announcements/add', adminController.showAddAnnouncementForm);
router.post(
    '/announcements/add',
    validationMiddleware.validateAnnouncementCreate || ((req, res, next) => next()),
    adminController.addAnnouncement
);
router.post('/announcements/delete/:id', adminController.deleteAnnouncement);

module.exports = router;
