const express = require('express');
const router = express.Router();

const gradesController = require('../controllers/gradesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all grade routes
router.use(authMiddleware.authenticate);

// List all grades for logged-in student
router.get('/', gradesController.listGrades);

// View grades for a specific course
router.get('/course/:courseId', gradesController.viewCourseGrades);

// Admin: view grades of a specific student
router.get('/student/:studentId', authMiddleware.requireRole(['Admin', 'Super Admin']), gradesController.viewStudentGrades);

// Admin: add a new grade
router.post('/add', authMiddleware.requireRole(['Admin', 'Super Admin']), gradesController.addGrade);

// Admin: edit a grade
router.post('/:gradeId/edit', authMiddleware.requireRole(['Admin', 'Super Admin']), gradesController.editGrade);

// Admin: delete a grade
router.post('/:gradeId/delete', authMiddleware.requireRole(['Admin', 'Super Admin']), gradesController.deleteGrade);

module.exports = router;
