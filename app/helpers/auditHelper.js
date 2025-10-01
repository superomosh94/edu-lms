const pool = require('../controllers/config/db');

exports.logAudit = async (userId, action, meta = {}) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, meta) VALUES (?, ?, ?)',
      [
        userId,
        action,
        meta ? JSON.stringify(meta) : null
      ]
    );
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
};

exports.getAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params = [];

    if (filters.userId) {
      whereClause += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.action) {
      whereClause += ' AND action LIKE ?';
      params.push(`%${filters.action}%`);
    }

    if (filters.startDate && filters.endDate) {
      whereClause += ' AND created_at BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [logs] = await pool.query(
      `SELECT al.*, u.name as user_name, u.email 
       FROM audit_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       WHERE 1=1 ${whereClause}
       ORDER BY al.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM audit_logs 
       WHERE 1=1 ${whereClause}`,
      params
    );

    return {
      logs,
      total: totalRows[0]?.count || 0,
      page,
      totalPages: Math.ceil((totalRows[0]?.count || 0) / limit)
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};
exports.logAction = exports.logAudit;
