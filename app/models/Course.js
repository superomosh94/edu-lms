const pool = require('../../app/controllers/config/db');

class Course {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM courses');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)',
      [data.title, data.description, data.teacherId]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    await pool.query(
      'UPDATE courses SET title = ?, description = ? WHERE id = ?',
      [data.title, data.description, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
  }

  static async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM courses');
    return rows[0].count || 0;
  }
}

module.exports = Course;
