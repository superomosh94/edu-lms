// app/controllers/gradesController.js

const pool = require('./config/db');

// Student: list logged-in user's grades
exports.listGrades = async (req, res) => {
    try {
        const userId = req.user.id;
        const [grades] = await pool.query(`
            SELECT c.title AS course, g.grade
            FROM grades g
            JOIN courses c ON g.course_id = c.id
            WHERE g.student_id = ?
        `, [userId]);

        res.render('grades/list', {
            title: "Grades",
            user: req.user || null,
            grades
        });
    } catch (error) {
        console.error("Error loading grades:", error);
        res.status(500).send("Error loading grades");
    }
};

// Student: view grades for a specific course
exports.viewCourseGrades = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const [grades] = await pool.query(`
            SELECT c.title AS course, g.grade
            FROM grades g
            JOIN courses c ON g.course_id = c.id
            WHERE g.student_id = ? AND c.id = ?
        `, [userId, courseId]);

        res.render('grades/course', {
            title: "Course Grades",
            user: req.user || null,
            grades
        });
    } catch (error) {
        console.error("Error loading course grades:", error);
        res.status(500).send("Error loading course grades");
    }
};

// Admin: view grades for a student
exports.viewStudentGrades = async (req, res) => {
    res.send("View student grades - to be implemented");
};

// Admin: add grade
exports.addGrade = async (req, res) => {
    res.send("Add grade - to be implemented");
};

// Admin: edit grade
exports.editGrade = async (req, res) => {
    res.send("Edit grade - to be implemented");
};

// Admin: delete grade
exports.deleteGrade = async (req, res) => {
    res.send("Delete grade - to be implemented");
};
