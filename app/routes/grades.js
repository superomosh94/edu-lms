const express = require('express');
const router = express.Router();
const db = require('../controllers/config/db'); // correct path

// Route: List all grades
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT grades.id, students.name AS student_name, grades.course, grades.grade
            FROM grades
            JOIN students ON grades.student_id = students.id
        `);

        res.render('grades', {
            title: 'All Grades',
            grades: results
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Route: Grades for a specific student
router.get('/:studentId', async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const [results] = await db.query(`
            SELECT grades.course, grades.grade
            FROM grades
            WHERE student_id = ?
        `, [studentId]);

        if (results.length === 0) {
            return res.status(404).render('error', {
                title: 'No Grades Found',
                message: 'No grades available for this student.',
                error: null
            });
        }

        res.render('grades', {
            title: `Grades for Student ${studentId}`,
            grades: results
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
