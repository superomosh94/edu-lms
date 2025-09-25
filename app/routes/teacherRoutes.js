const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// All teacher routes require teacher role
router.use(authMiddleware.authenticate);
router.use(roleMiddleware.restrictTo('teacher', 'admin'));

// Course management
router.get('/courses', teacherController.getMyCourses);
router.get('/students', teacherController.getMyStudents);

// Assignment management
router.get('/submissions', teacherController.getSubmissions);
router.get('/submissions/:id', teacherController.getSubmission);
router.post('/submissions/:id/grade', 
    validationMiddleware.validateGrading,
    teacherController.gradeSubmission
);

// Analytics
router.get('/courses/:courseId/analytics', teacherController.getCourseAnalytics);

// Communication
router.post('/courses/:courseId/announcements', 
    validationMiddleware.validateAnnouncement,
    teacherController.sendAnnouncement
);

module.exports = router;