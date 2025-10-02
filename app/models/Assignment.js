const pool = require('../controllers/config/db');

class Assignment {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM assignments');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM assignments WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO assignments (title, description, due_date, teacher_id, course_id) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.description, data.dueDate, data.teacherId, data.courseId]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    await pool.query(
      'UPDATE assignments SET title = ?, description = ?, due_date = ? WHERE id = ?',
      [data.title, data.description, data.dueDate, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM assignments WHERE id = ?', [id]);
  }

  static async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM assignments');
    return rows[0].count || 0;
  }

  static async getByStudent(studentId) {
    const [rows] = await pool.query(
      `
      SELECT a.*, s.id AS submissionId, s.grade, s.submitted_at AS submittedAt
      FROM assignments a
      JOIN submissions s ON a.id = s.assignment_id
      WHERE s.student_id = ?
      `,
      [studentId]
    );
    return rows;
  }

  static async getStudentSubmissions(studentId) {
    const [rows] = await pool.query(
      `
      SELECT s.*, a.title AS assignmentTitle, a.due_date
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = ?
      `,
      [studentId]
    );
    return rows;
  }

  static async getCountByCourse(courseId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM assignments WHERE course_id = ?',
      [courseId]
    );
    return rows[0].count || 0;
  }

  static async getCompletedCountByStudent(courseId, studentId) {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.course_id = ? AND s.student_id = ? AND s.grade IS NOT NULL
      `,
      [courseId, studentId]
    );
    return rows[0].count || 0;
  }

  static async getAverageGradeByCourseAndStudent(courseId, studentId) {
    const [rows] = await pool.query(
      `
      SELECT AVG(s.grade) AS average
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.course_id = ? AND s.student_id = ? AND s.grade IS NOT NULL
      `,
      [courseId, studentId]
    );
    return rows[0].average || null;
  }

  static async getAverageGrade(studentId) {
    const [rows] = await pool.query(
      `
      SELECT AVG(s.grade) AS average
      FROM submissions s
      WHERE s.student_id = ? AND s.grade IS NOT NULL
      `,
      [studentId]
    );
    return rows[0].average || null;
  }

  static async findByCourse(courseId) {
    const [rows] = await pool.query(
      'SELECT * FROM assignments WHERE course_id = ?',
      [courseId]
    );
    return rows;
  }

  static async getGradesByStudent(studentId) {
    const [rows] = await pool.query(
      `
      SELECT a.id AS assignmentId, a.title AS assignmentTitle, s.grade, s.submitted_at AS submittedAt
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = ?
      `,
      [studentId]
    );
    return rows;
  }

  static async getTotalAssignmentsCount(studentId) {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM submissions s
      WHERE s.student_id = ?
      `,
      [studentId]
    );
    return rows[0].count || 0;
  }

  static async getCompletedCount(studentId) {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM submissions s
      WHERE s.student_id = ? AND s.grade IS NOT NULL
      `,
      [studentId]
    );
    return rows[0].count || 0;
  }

  static async getPendingCount(studentId) {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM submissions s
      WHERE s.student_id = ? AND s.grade IS NULL
      `,
      [studentId]
    );
    return rows[0].count || 0;
  }

  static async getSubmissionById(submissionId) {
    const [rows] = await pool.query(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );
    return rows[0] || null;
  }

  static async getStudentSubmission(assignmentId, studentId) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE assignment_id = ? AND student_id = ?
      `,
      [assignmentId, studentId]
    );
    return rows[0] || null;
  }
}

module.exports = Assignment;
