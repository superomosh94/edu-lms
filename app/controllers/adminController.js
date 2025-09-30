const pool = require('./config/db');
const auditHelper = require('../helpers/auditHelper');

const adminController = {
    getDashboard: async (req, res) => {
        try {
            const [[{ count: totalUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
            const [[{ count: admins }]] = await pool.query(`
                SELECT COUNT(*) AS count 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE r.name = 'Admin'
            `);
            const [[{ count: teachers }]] = await pool.query(`
                SELECT COUNT(*) AS count 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE r.name = 'Teacher'
            `);
            const [[{ count: students }]] = await pool.query(`
                SELECT COUNT(*) AS count 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE r.name = 'Student'
            `);
            const [[{ count: activeUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE is_active = 1');
            const [[{ count: inactiveUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE is_active = 0');
            const [[{ count: totalCourses }]] = await pool.query('SELECT COUNT(*) AS count FROM courses');
            const [[{ count: totalPayments }]] = await pool.query('SELECT COUNT(*) AS count FROM payments');
            const [[{ total: totalRevenue }]] = await pool.query(`
                SELECT COALESCE(SUM(amount),0) AS total 
                FROM payments 
                WHERE status = 'completed'
            `);

            const stats = {
                users: {
                    total: totalUsers || 0,
                    byRole: { admin: admins || 0, teacher: teachers || 0, student: students || 0 },
                    byStatus: { active: activeUsers || 0, inactive: inactiveUsers || 0 }
                },
                courses: { total: totalCourses || 0 },
                payments: { total: totalPayments || 0, totalRevenue: totalRevenue || 0 }
            };

            res.render('admin/dashboard', { stats });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send('Internal server error');
        }
    },

    getSystemStats: async (req, res) => {
        try {
            const [[{ count: totalUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
            res.render('admin/stats', { totalUsers });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading system stats');
        }
    },

    getAuditLogs: async (req, res) => {
        try {
            const [logs] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
            res.render('admin/auditLogs', { logs });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading audit logs');
        }
    },

    generateReport: async (req, res) => {
        try {
            const [reportData] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
            res.render('admin/reports', { reportData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating report');
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const [users] = await pool.query(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active 
                FROM users u 
                JOIN roles r ON u.role_id = r.id
            `);
            res.render('admin/users', { users, activePage: 'users', user: req.session });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading users');
        }
    },

    showAddUserForm: (req, res) => {
        res.render('admin/addUser');
    },

    showEditUserForm: async (req, res) => {
        try {
            const { id } = req.params;

            const [[user]] = await pool.query(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `, [id]);

            if (!user) {
                return res.status(404).send('User not found');
            }

            const [roles] = await pool.query('SELECT name FROM roles');

            res.render('admin/editUser', {
                user,
                roles,
                activePage: 'users',
                userSession: req.session
            });
        } catch (error) {
            console.error('Show edit user error:', error);
            res.status(500).send('Internal server error');
        }
    },

    addUser: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;
            if (!name || !email || !password || !role) {
                return res.status(400).send('Missing fields');
            }

            const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
            if (!roleRow) return res.status(400).send('Invalid role');

            const [result] = await pool.query(
                'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
                [name, email, password, roleRow.id]
            );

            await auditHelper.logAction(req.userId, 'ADMIN_CREATE_USER', `Created user ${email}`, result.insertId);
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Add user error:', error);
            res.status(500).send('Internal server error');
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;
            const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
            if (!roleRow) return res.status(400).send('Invalid role');

            await pool.query(
                'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
                [name, email, roleRow.id, id]
            );
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating user');
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM users WHERE id = ?', [id]);
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error deleting user');
        }
    },

    showAddCourseForm: (req, res) => {
        res.render('admin/addCourse');
    },

    addCourse: async (req, res) => {
        try {
            const { title, description, teacher_id } = req.body;
            if (!title || !description || !teacher_id) {
                return res.status(400).send('Missing fields');
            }

            const [result] = await pool.query(
                'INSERT INTO courses (title, description, teacher_id, status) VALUES (?, ?, ?, ?)',
                [title, description, teacher_id, 'pending']
            );

            await auditHelper.logAction(req.userId, 'ADMIN_CREATE_COURSE', `Created course ${title}`, result.insertId);
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    },

    moderateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error moderating course');
        }
    },

    getAllCourses: async (req, res) => {
        try {
            const [courses] = await pool.query(`
                SELECT c.id, c.title, c.description, c.status, u.name AS teacher
                FROM courses c
                JOIN users u ON c.teacher_id = u.id
                ORDER BY c.id DESC
            `);
            res.render('admin/courses', { courses, activePage: 'courses', userSession: req.session });
        } catch (error) {
            console.error('Error loading courses:', error);
            res.status(500).send('Error loading courses');
        }
    }
};

module.exports = adminController;
