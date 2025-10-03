const pool = require('../controllers/config/db'); // your DB connection

class Enrollment {
    static async create({ studentId, courseId }) {
        const [result] = await pool.query(
            "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
            [studentId, courseId]
        );
        return result;
    }

    static async findByStudent(studentId) {
        const [rows] = await pool.query(
            "SELECT * FROM enrollments WHERE student_id = ?",
            [studentId]
        );
        return rows;
    }

    static async isEnrolled(studentId, courseId) {
        const [rows] = await pool.query(
            "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?",
            [studentId, courseId]
        );
        return rows.length > 0;
    }
}

module.exports = Enrollment;
