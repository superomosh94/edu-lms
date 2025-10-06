const pool = require('../controllers/config/db');

class Course {
    static async findAll({ page = 1, limit = 10, status } = {}) {
        try {
            let query = 'SELECT * FROM courses';
            const params = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error("Course.findAll error:", error);
            throw error;
        }
    }

    static async findAvailable() {
        try {
            const [rows] = await pool.query(
                "SELECT * FROM courses WHERE status = 'active'"
            );
            return rows;
        } catch (error) {
            console.error("Course.findAvailable error:", error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Course.findById error:", error);
            throw error;
        }
    }

    static async findByStudent(studentId) {
        try {
            const [rows] = await pool.query(`
                SELECT c.*
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.student_id = ?`,
                [studentId]
            );
            return rows;
        } catch (error) {
            console.error("Course.findByStudent error:", error);
            throw error;
        }
    }

    static async isStudentEnrolled(courseId, studentId) {
        try {
            const [rows] = await pool.query(`
                SELECT 1
                FROM enrollments
                WHERE course_id = ? AND student_id = ? LIMIT 1`,
                [courseId, studentId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error("Course.isStudentEnrolled error:", error);
            throw error;
        }
    }

    static async findByCategories(limit = 5, excludeStudentId) {
        try {
            const safeLimit = parseInt(limit) > 0 ? parseInt(limit) : 5;

            const [rows] = await pool.query(`
                SELECT DISTINCT c.*
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.student_id != ?
                LIMIT ?`,
                [excludeStudentId, safeLimit]
            );
            return rows;
        } catch (error) {
            console.error("Course.findByCategories error:", error);
            throw error;
        }
    }

    static async findPopular(limit = 5) {
        try {
            const safeLimit = parseInt(limit) > 0 ? parseInt(limit) : 5;

            const [rows] = await pool.query(`
                SELECT c.*, COUNT(e.student_id) AS enrollmentCount
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id
                GROUP BY c.id
                ORDER BY enrollmentCount DESC
                LIMIT ?`,
                [safeLimit]
            );
            return rows;
        } catch (error) {
            console.error("Course.findPopular error:", error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const [result] = await pool.query(
                'INSERT INTO courses (title, description, teacher_id, status, image) VALUES (?, ?, ?, ?, ?)',
                [
                    data.title,
                    data.description,
                    data.teacherId || null,
                    data.status || 'active',
                    data.image || null
                ]
            );
            return this.findById(result.insertId);
        } catch (error) {
            console.error("Course.create error:", error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const fields = [];
            const params = [];

            if (data.title) {
                fields.push('title = ?');
                params.push(data.title);
            }
            if (data.description) {
                fields.push('description = ?');
                params.push(data.description);
            }
            if (data.status) {
                fields.push('status = ?');
                params.push(data.status);
            }
            if (data.teacherId) {
                fields.push('teacher_id = ?');
                params.push(data.teacherId);
            }
            if (data.image) {
                fields.push('image = ?');
                params.push(data.image);
            }

            if (fields.length === 0) {
                console.warn("Course.update: No fields to update");
                return false;
            }

            params.push(id);
            const [result] = await pool.query(
                `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
                params
            );

            if (result.affectedRows > 0) {
                return this.findById(id);
            } else {
                console.warn(`Course.update: No course updated for id ${id}`);
                return null;
            }
        } catch (error) {
            console.error("Course.update error:", error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Course.delete error:", error);
            throw error;
        }
    }

    static async getCount({ status } = {}) {
        try {
            let query = 'SELECT COUNT(*) AS count FROM courses';
            const params = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].count || 0;
        } catch (error) {
            console.error("Course.getCount error:", error);
            throw error;
        }
    }
}

module.exports = Course;
