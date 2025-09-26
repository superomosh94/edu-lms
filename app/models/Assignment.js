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
      'INSERT INTO assignments (title, description, due_date, teacher_id) VALUES (?, ?, ?, ?)',
      [data.title, data.description, data.dueDate, data.teacherId]
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
}

module.exports = Assignment;
