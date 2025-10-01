const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Placeholder validation middleware
const validationMiddleware = {
    validateCourseCreation: (req, res, next) => next(),
    validateCourseUpdate: (req, res, next) => next()
};

// Public routes
router.get('/', courseController.getAllCourses);

// Protected routes
router.use(authMiddleware.authenticate);
router.get('/view/:id', courseController.getCourse);

// Teacher/Admin routes
router.get('/create', roleMiddleware.restrictTo('teacher', 'admin'), courseController.showCreateForm);
router.post('/create', roleMiddleware.restrictTo('teacher', 'admin'), validationMiddleware.validateCourseCreation, courseController.createCourse);
router.get('/:id/edit', roleMiddleware.restrictTo('teacher', 'admin'), courseController.showEditForm);
router.post('/:id/edit', roleMiddleware.restrictTo('teacher', 'admin'), validationMiddleware.validateCourseUpdate, courseController.updateCourse);

// Only Admin can delete
router.post('/:id/delete', roleMiddleware.restrictTo('admin'), courseController.deleteCourse);

// Student routes
router.post('/:id/enroll', roleMiddleware.restrictTo('student'), courseController.enrollInCourse);
router.get('/student/my-courses', roleMiddleware.restrictTo('student'), courseController.getMyCourses);

// Teacher view their courses
router.get('/teacher/my-courses', roleMiddleware.restrictTo('teacher', 'admin'), courseController.getTeacherCourses);

// This must be last
router.get('/:id', courseController.getCourse);

module.exports = router;
