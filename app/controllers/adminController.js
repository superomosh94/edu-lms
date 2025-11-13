const pool = require('./config/db');
const auditHelper = require('../helpers/auditHelper');

const adminController = {
    // DASHBOARD
    getDashboard: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            res.render('admin/dashboard', { 
                stats,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send('Internal server error');
        }
    },

    getSystemOverview: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            res.render('admin/systemOverview', { 
                stats,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error('System Overview error:', error);
            res.status(500).send('Error loading system overview');
        }
    },

    getSystemStats: async () => {
        const [[{ count: totalUsers }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
        const [[{ count: admins }]] = await pool.query(`
            SELECT COUNT(*) AS count FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name = 'Admin'
        `);
        const [[{ count: teachers }]] = await pool.query(`
            SELECT COUNT(*) AS count FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name = 'Teacher'
        `);
        const [[{ count: students }]] = await pool.query(`
            SELECT COUNT(*) AS count FROM users u 
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

        return {
            users: {
                total: totalUsers || 0,
                byRole: { admin: admins || 0, teacher: teachers || 0, student: students || 0 },
                byStatus: { active: activeUsers || 0, inactive: inactiveUsers || 0 }
            },
            courses: { total: totalCourses || 0 },
            payments: { total: totalPayments || 0, totalRevenue: totalRevenue || 0 }
        };
    },

    getSystemStatsPage: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            res.render('admin/stats', {
                totalUsers: stats.users.total,
                totalCourses: stats.courses.total,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading system stats');
        }
    },

    getAuditLogs: async (req, res) => {
        try {
            const [logs] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
            res.render('admin/auditLogs', { 
                logs,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading audit logs');
        }
    },

    generateReport: async (req, res) => {
        try {
            const [reportData] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
            res.render('admin/reports', { 
                reportData,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating report');
        }
    },

    // SETTINGS
    showSettings: async (req, res) => {
        try {
            res.render('admin/settings', { 
                activePage: 'settings',
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error('Show settings error:', error);
            res.status(500).send('Error loading settings');
        }
    },

    updateSettings: async (req, res) => {
        try {
            const { siteName, siteDescription } = req.body;
            await pool.query(
                'UPDATE settings SET site_name = ?, site_description = ? WHERE id = 1',
                [siteName, siteDescription]
            );
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_SETTINGS', { siteName, siteDescription });
            res.redirect('/admin/settings');
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).send('Error updating settings');
        }
    },

    // USERS
    getAllUsers: async (req, res) => {
        try {
            const [users] = await pool.query(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active
                FROM users u 
                JOIN roles r ON u.role_id = r.id
            `);
            res.render('admin/users', { 
                users, 
                activePage: 'users', 
                userSession: req.session,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading users');
        }
    },

    showAddUserForm: (req, res) => res.render('admin/addUser', {
        success_msg: req.flash ? req.flash('success_msg') : [],
        error_msg: req.flash ? req.flash('error_msg') : []
    }),

    showEditUserForm: async (req, res) => {
        try {
            const { id } = req.params;
            const [[user]] = await pool.query(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `, [id]);
            if (!user) return res.status(404).send('User not found');
            const [roles] = await pool.query('SELECT name FROM roles');
            res.render('admin/editUser', { 
                user, 
                roles, 
                activePage: 'users', 
                userSession: req.session,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    },

    addUser: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;
            if (!name || !email || !password || !role) return res.status(400).send('Missing fields');
            const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
            if (!roleRow) return res.status(400).send('Invalid role');
            const [result] = await pool.query(
                'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
                [name, email, password, roleRow.id]
            );
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_USER', { userId: result.insertId, email });
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
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
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_USER', { userId: id, email });
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
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_USER', { userId: id });
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error deleting user');
        }
    },

    // COURSES - FIXED: Only one showAddCourseForm method
    showAddCourseForm: async (req, res) => {
        try {
            const [teachers] = await pool.query(`
                SELECT u.id, u.name FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'Teacher' OR r.name = 'instructor'
            `);
            
            res.render('admin/addCourse', { 
                teachers: teachers || [],
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error loading add course form');
            res.redirect('/admin/courses');
        }
    },

    // ADD MISSING METHODS
    showEditCourseForm: async (req, res) => {
        try {
            const { id } = req.params;
            const [[course]] = await pool.query(`
                SELECT c.*, u.name as teacher_name 
                FROM courses c 
                JOIN users u ON c.teacher_id = u.id 
                WHERE c.id = ?
            `, [id]);
            
            if (!course) {
                return res.status(404).send('Course not found');
            }

            const [teachers] = await pool.query(`
                SELECT u.id, u.name FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'Teacher' OR r.name = 'instructor'
            `);

            res.render('admin/editCourse', {
                course,
                teachers: teachers || [],
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error loading course edit form');
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, teacher_id, status } = req.body;

            await pool.query(
                'UPDATE courses SET title = ?, description = ?, teacher_id = ?, status = ? WHERE id = ?',
                [title, description, teacher_id, status, id]
            );

            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_COURSE', { courseId: id, title });
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating course');
        }
    },

    updateCourseStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_COURSE_STATUS', { courseId: id, status });
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating course status');
        }
    },

    addCourse: async (req, res) => {
        try {
            const { title, description, teacher_id } = req.body;
            if (!title || !description || !teacher_id) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect('/admin/courses/add');
            }
            
            const [result] = await pool.query(
                'INSERT INTO courses (title, description, teacher_id, status) VALUES (?, ?, ?, ?)',
                [title, description, teacher_id, 'pending']
            );
            
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_COURSE', { courseId: result.insertId, title });
            req.flash('success_msg', 'Course created successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error creating course');
            res.redirect('/admin/courses/add');
        }
    },

    moderateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
            await auditHelper.logAudit(req.userId, 'ADMIN_MODERATE_COURSE', { courseId: id, status });
            req.flash('success_msg', 'Course status updated successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error moderating course');
            res.redirect('/admin/courses');
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                req.flash('error_msg', 'Course not found');
                return res.redirect('/admin/courses');
            }
            
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_COURSE', { courseId: id });
            req.flash('success_msg', 'Course deleted successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error deleting course');
            res.redirect('/admin/courses');
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
            res.render('admin/courses', { 
                courses: courses || [], 
                activePage: 'courses', 
                userSession: req.session,
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error(error);
            req.flash('error_msg', 'Error loading courses');
            res.redirect('/admin/dashboard');
        }
    },

    // ANNOUNCEMENTS
    getAnnouncements: async (req, res) => {
        try {
            const [announcements] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
            res.render('admin/announcements', { 
                announcements: announcements || [],
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error('Error loading announcements:', error);
            res.status(500).send('Error loading announcements');
        }
    },

    showAddAnnouncementForm: (req, res) => {
        try {
            res.render('admin/addAnnouncement', {
                success_msg: req.flash ? req.flash('success_msg') : [],
                error_msg: req.flash ? req.flash('error_msg') : []
            });
        } catch (error) {
            console.error('Error showing add announcement form:', error);
            res.status(500).send('Error loading form');
        }
    },

    addAnnouncement: async (req, res) => {
        try {
            const { title, message } = req.body;
            if (!title || !message) return res.status(400).send('Missing fields');
            await pool.query('INSERT INTO announcements (title, message, created_at) VALUES (?, ?, NOW())', [
                title,
                message
            ]);
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_ANNOUNCEMENT', { title });
            res.redirect('/admin/announcements');
        } catch (error) {
            console.error('Error adding announcement:', error);
            res.status(500).send('Error adding announcement');
        }
    },

    deleteAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_ANNOUNCEMENT', { id });
            res.redirect('/admin/announcements');
        } catch (error) {
            console.error('Error deleting announcement:', error);
            res.status(500).send('Error deleting announcement');
        }
    }
};

module.exports = adminController;