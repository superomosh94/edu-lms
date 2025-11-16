const db = require('../controllers/config/db');

class User {
  static async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1`,
      [id]
    );
    return rows[0];
  }

  static async create(userData) {
    const { name, email, password } = userData;
    
    // All new registrations get 'Student' role by default
    const [roleResult] = await db.execute(
      'SELECT id FROM roles WHERE name = "Student"'
    );
    
    if (!roleResult[0]) {
      throw new Error('Student role not found in database');
    }
    
    const studentRoleId = roleResult[0].id;

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, password, studentRoleId]
    );
    return result.insertId;
  }

  static async updatePassword(id, hashedPassword) {
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }

  static async createPasswordResetToken(userId, token, expiresAt) {
    // First, clear any existing tokens for this user
    await db.execute(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [userId]
    );
    
    // Insert new token
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  }

  static async findByResetToken(token) {
    const [rows] = await db.execute(
      `SELECT prt.*, u.*, r.name as role_name 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       JOIN roles r ON u.role_id = r.id
       WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used = 0 AND u.is_active = 1`,
      [token]
    );
    return rows[0];
  }

  static async markTokenAsUsed(token) {
    await db.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      [token]
    );
  }

  static async emailExists(email) {
    const [rows] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  }
}

module.exports = User;