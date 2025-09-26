const pool = require('./config/db');
const auditHelper = require('../helpers/auditHelper');

const adminController = {
    // Get system statistics
    getSystemStats: async (req, res) => {
        try {
            const [[{ count: totalUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
            const [[{ count: admins }]] = await pool.query(`SELECT COUNT(*) AS count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin'`);
            const [[{ count: teachers }]] = await pool.query(`SELECT COUNT(*) AS count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Teacher'`);
            const [[{ count: students }]] = await pool.query(`SELECT COUNT(*) AS count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Student'`);
            const [[{ count: activeUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE is_active = 1');
            const [[{ count: inactiveUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE is_active = 0');

            const [[{ count: totalCourses }]] = await pool.query('SELECT COUNT(*) AS count FROM courses');

            const [[{ count: totalPayments }]] = await pool.query('SELECT COUNT(*) AS count FROM payments');
            const [[{ total: totalRevenue }]] = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status = 'completed'`);
            const [[{ count: completedPayments }]] = await pool.query(`SELECT COUNT(*) AS count FROM payments WHERE status = 'completed'`);
            const [[{ count: failedPayments }]] = await pool.query(`SELECT COUNT(*) AS count FROM payments WHERE status = 'failed'`);
            const [[{ count: pendingPayments }]] = await pool.query(`SELECT COUNT(*) AS count FROM payments WHERE status = 'pending'`);

            const stats = {
                users: {
                    total: totalUsers || 0,
                    byRole: { admin: admins || 0, teacher: teachers || 0, student: students || 0 },
                    byStatus: { active: activeUsers || 0, inactive: inactiveUsers || 0 }
                },
                courses: { total: totalCourses || 0 },
                payments: {
                    total: totalPayments || 0,
                    totalRevenue: totalRevenue || 0,
                    byStatus: { completed: completedPayments || 0, failed: failedPayments || 0, pending: pendingPayments || 0 }
                }
            };

            res.json({ stats });
        } catch (error) {
            console.error('Get system stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get all users with pagination and filtering
    getAllUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '10', 10);
            const offset = (page - 1) * limit;
            const role = req.query.role; // role name e.g., 'Admin'
            const status = req.query.status; // 'active' | 'inactive'

            let where = [];
            let params = [];
            if (role) {
                where.push('r.name = ?');
                params.push(role);
            }
            if (status) {
                where.push('u.is_active = ?');
                params.push(status === 'active' ? 1 : 0);
            }
            const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

            const [rows] = await pool.query(
                `SELECT u.id, u.name, u.email, u.is_active, r.name AS role
                 FROM users u JOIN roles r ON u.role_id = r.id
                 ${whereSql}
                 ORDER BY u.id DESC
                 LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            const [[{ count: total }]] = await pool.query(
                `SELECT COUNT(*) AS count
                 FROM users u JOIN roles r ON u.role_id = r.id
                 ${whereSql}`,
                params
            );

            res.json({ users: rows, pagination: { page, limit, total } });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update user status or role
    updateUser: async (req, res) => {
        try {
            const userId = req.params.id;
            const { status, role } = req.body;

            const [[user]] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updateData = {};
            if (status) updateData.is_active = status === 'active' ? 1 : 0;
            if (role) {
                const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
                if (roleRow) updateData.role_id = roleRow.id;
            }

            const fields = Object.keys(updateData);
            if (fields.length) {
                const setSql = fields.map(f => `${f} = ?`).join(', ');
                await pool.query(`UPDATE users SET ${setSql} WHERE id = ?`, [...fields.map(f => updateData[f]), userId]);
            }

            // Log audit trail
            await auditHelper.logAction(req.userId, 'ADMIN_UPDATE_USER', 
                `Updated user ${userId}`, userId);

            const [[updated]] = await pool.query('SELECT u.id, u.name, u.email, u.is_active, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [userId]);
            res.json({ message: 'User updated successfully', user: updated });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const userId = req.params.id;

            const [[user]] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent self-deletion
            if (userId === req.userId) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            await pool.query('DELETE FROM users WHERE id = ?', [userId]);

            // Log audit trail
            await auditHelper.logAction(req.userId, 'ADMIN_DELETE_USER', 
                `Deleted user ${userId}`, userId);

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Approve/reject course
    moderateCourse: async (req, res) => {
        try {
            const courseId = req.params.id;
            const { action, reason } = req.body; // action: 'approve' or 'reject'

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const newStatus = action === 'approve' ? 'active' : 'rejected';
            await Course.updateStatus(courseId, newStatus);

            // Log audit trail
            await auditHelper.logAction(req.userId, 'ADMIN_MODERATE_COURSE', 
                `${action} course: ${course.title}`, courseId);

            res.json({
                message: `Course ${action}d successfully`,
                course: await Course.findById(courseId)
            });
        } catch (error) {
            console.error('Moderate course error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get audit logs
    getAuditLogs: async (req, res) => {
        try {
            const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
            
            const logs = await auditHelper.getLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                action,
                userId,
                startDate,
                endDate
            });

            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: await auditHelper.getLogsCount({ action, userId, startDate, endDate })
                }
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Generate report
    generateReport: async (req, res) => {
        try {
            const { type, startDate, endDate } = req.query;
            
            let report;
            switch (type) {
                case 'user-registration':
                    report = (await pool.query(
                        `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users
                         WHERE created_at BETWEEN ? AND ? GROUP BY DATE(created_at) ORDER BY day`
                    , [startDate, endDate]))[0];
                    break;
                case 'revenue':
                    report = (await pool.query(
                        `SELECT DATE(payment_date) AS day, SUM(amount) AS total
                         FROM payments WHERE status = 'completed' AND payment_date BETWEEN ? AND ?
                         GROUP BY DATE(payment_date) ORDER BY day`
                    , [startDate, endDate]))[0];
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid report type' });
            }

            // Log audit trail
            await auditHelper.logAction(req.userId, 'ADMIN_GENERATE_REPORT', 
                `Generated ${type} report`);

            res.json({ report });
        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = adminController;