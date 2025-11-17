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

  // FIXED: Get assignments for student with proper submission status
  static async getByStudent(studentId) {
    const [rows] = await pool.query(
      `
      SELECT 
        a.*, 
        c.title AS course_title,
        c.course_code,
        s.id AS submission_id, 
        s.grade, 
        s.submitted_at AS submittedAt,
        s.content AS submission_content,
        CASE 
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due_date < NOW() THEN 'overdue'
          ELSE 'pending'
        END AS submissionStatus
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE e.student_id = ? AND e.status = 'active'
      ORDER BY a.due_date ASC
      `,
      [studentId, studentId]
    );
    return rows;
  }

  static async getStudentSubmissions(studentId) {
    const [rows] = await pool.query(
      `
      SELECT 
        s.*, 
        a.title AS assignment_title, 
        a.due_date,
        c.title AS course_title,
        c.course_code
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
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

  static async getAverageGradeByStudent(studentId) {
    return this.getAverageGrade(studentId);
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
      SELECT 
        a.id AS assignment_id, 
        a.title AS assignment_title, 
        s.grade, 
        s.submitted_at AS submitted_at,
        s.feedback,
        c.title AS course_title
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ? AND s.grade IS NOT NULL
      ORDER BY s.submitted_at DESC
      `,
      [studentId]
    );
    return rows;
  }

  static async getTotalAssignmentsCount(studentId) {
    const [rows] = await pool.query(
      `
      SELECT COUNT(DISTINCT a.id) AS count
      FROM assignments a
      JOIN enrollments e ON a.course_id = e.course_id
      WHERE e.student_id = ? AND e.status = 'active'
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
      SELECT COUNT(DISTINCT a.id) AS count
      FROM assignments a
      JOIN enrollments e ON a.course_id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE e.student_id = ? AND e.status = 'active' AND s.id IS NULL
      `,
      [studentId, studentId]
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

  // ADD THIS MISSING METHOD - createSubmission
  static async createSubmission(submissionData) {
    try {
      const { assignmentId, studentId, content, notes, submittedAt } = submissionData;
      
      const [result] = await pool.query(
        `INSERT INTO submissions (assignment_id, student_id, content, submitted_at) 
         VALUES (?, ?, ?, ?)`,
        [assignmentId, studentId, content, submittedAt || new Date()]
      );
      
      return {
        id: result.insertId,
        assignmentId,
        studentId,
        content,
        submittedAt: submittedAt || new Date()
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  // ADD THIS HELPER METHOD TO CHECK IF STUDENT IS ENROLLED
  static async isStudentEnrolled(studentId, courseId) {
    const [rows] = await pool.query(
      `SELECT * FROM enrollments 
       WHERE student_id = ? AND course_id = ? AND status = 'active'`,
      [studentId, courseId]
    );
    return rows.length > 0;
  }
}

module.exports = Assignment;