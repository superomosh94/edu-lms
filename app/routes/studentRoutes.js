const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Require authentication and student role
router.use(authMiddleware.authenticate);
router.use(roleMiddleware.restrictTo('Student'));

// Courses
router.get('/courses', studentController.getMyCourses);
router.get('/courses/:courseId', studentController.getCourse);

// Enrollments
router.get('/enroll', studentController.getEnrollPage);
router.post('/enroll', studentController.postEnroll);

// Assignments - ADD THE MISSING ROUTE HERE
router.get('/assignments', studentController.getAssignments);
router.get('/assignments/:id', studentController.getAssignmentDetail); // ADD THIS LINE
router.get('/assignments/:id/detail', studentController.getAssignmentDetail); // Detail page
router.get('/assignments/:id/submit', studentController.getAssignmentSubmitPage); // Submission page
router.post('/assignments/:id/submit', studentController.submitAssignment); // Submission action

// Submissions
router.get('/submissions', studentController.getMySubmissions);
router.get('/submissions/:id', studentController.getSubmission);

// Grades
router.get('/grades', studentController.getMyGrades);

// Recommendations
router.get('/recommendations', studentController.getCourseRecommendations);

// Notifications
router.get('/notifications', studentController.getNotifications);

// Profile management
router.put(
    '/profile',
    validationMiddleware.validateStudentProfileUpdate,
    studentController.updateProfile
);

module.exports = router;