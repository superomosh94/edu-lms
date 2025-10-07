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

// Create Course
router.get('/courses/create', teacherController.showCreateCoursePage);
router.post('/courses/create', teacherController.createCourse);

// Assignments
router.get('/assignments', teacherController.showAssignmentsPage);

// Create Assignment
router.get('/assignments/create', teacherController.showCreateAssignmentPage);
router.post(
    '/assignments/create',
    validationMiddleware.validateAssignment,
    teacherController.createAssignment
);

// Submissions
router.get('/submissions', teacherController.showSubmissionsPage);
router.get('/submissions/:id', teacherController.getSubmission);

// Grade Submission
router.post('/submissions/:id/grade', teacherController.gradeSubmission);

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
