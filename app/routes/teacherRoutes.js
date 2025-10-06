const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// All teacher routes require authentication and teacher/admin role
router.use(authMiddleware.authenticate);
router.use(roleMiddleware.restrictTo('teacher', 'admin'));

// Dashboard
router.get('/', teacherController.showTeacherDashboard);

// Courses
router.get('/courses', teacherController.showCoursesPage);

// Assignments
router.get('/assignments', teacherController.showAssignmentsPage);

// Submissions
router.get('/submissions', teacherController.showSubmissionsPage);
router.get('/submissions/:id', teacherController.getSubmission);

// Grades
router.get('/grades', teacherController.showGradesPage);

// Announcements
router.get('/announcements', teacherController.showAnnouncementsPage);
router.post(
    '/announcements',
    validationMiddleware.validateAnnouncement,
    teacherController.sendAnnouncement
);

// Reports
router.get('/reports', teacherController.showReportsPage);

module.exports = router;
