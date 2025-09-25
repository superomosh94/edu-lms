const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// All student routes require student role
router.use(authMiddleware.authenticate);
router.use(roleMiddleware.restrictTo('student'));

// Course management
router.get('/courses', studentController.getMyCourses);
router.get('/courses/:courseId', studentController.getCourse);
router.get('/courses/recommendations', studentController.getCourseRecommendations);

// Assignment management
router.get('/submissions', studentController.getMySubmissions);
router.get('/submissions/:id', studentController.getSubmission);

// Grades and performance
router.get('/grades', studentController.getMyGrades);

// Profile management
router.put('/profile', 
    validationMiddleware.validateStudentProfileUpdate,
    studentController.updateProfile
);

module.exports = router;