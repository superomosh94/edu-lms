const pool = require('./config/db');
const auditHelper = require('../helpers/auditHelper');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Constants
const PAGINATION = {
    USERS_PER_PAGE: 10,
    COURSES_PER_PAGE: 10,
    ANNOUNCEMENTS_PER_PAGE: 10,
    AUDIT_LOGS_PER_PAGE: 15
};

// Helper functions
const getFlashMessages = (req) => ({
    success_msg: req.flash ? req.flash('success_msg') : [],
    error_msg: req.flash ? req.flash('error_msg') : []
});

const calculatePagination = (totalRecords, currentPage, limit) => {
    const totalPages = Math.ceil(totalRecords / limit);
    return {
        currentPage,
        totalPages,
        totalRecords,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};

const executeQuery = async (query, params = []) => {
    try {
        const [result] = await pool.query(query, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

const executeSingleResultQuery = async (query, params = []) => {
    try {
        const [[result]] = await pool.query(query, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper to render view content as HTML string
const renderViewContent = async (viewPath, data = {}) => {
    try {
        const viewFullPath = path.join(__dirname, '../views', `${viewPath}.ejs`);
        if (!fs.existsSync(viewFullPath)) {
            throw new Error(`View file not found: ${viewFullPath}`);
        }
        const template = fs.readFileSync(viewFullPath, 'utf8');
        return ejs.render(template, data);
    } catch (error) {
        console.error('Error rendering view content:', error);
        return '<div class="alert alert-danger">Error loading content: ' + error.message + '</div>';
    }
};

// Main controller
const adminController = {
    // DASHBOARD
    getDashboard: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            const bodyContent = await renderViewContent('admin/dashboard', { stats });
            
            res.render('layouts/admin-layout', {
                title: 'Admin Dashboard',
                activePage: 'dashboard',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load dashboard.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    getSystemOverview: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            const bodyContent = await renderViewContent('admin/systemOverview', { stats });
            
            res.render('layouts/admin-layout', {
                title: 'System Overview',
                activePage: 'system',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('System Overview error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load system overview.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    getSystemStats: async () => {
        try {
            const [
                totalUsers,
                admins,
                teachers,
                students,
                activeUsers,
                inactiveUsers,
                totalCourses,
                totalPayments,
                totalRevenue
            ] = await Promise.all([
                executeSingleResultQuery('SELECT COUNT(*) AS count FROM users'),
                executeSingleResultQuery(`
                    SELECT COUNT(*) AS count FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE r.name = 'Admin'
                `),
                executeSingleResultQuery(`
                    SELECT COUNT(*) AS count FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE r.name = 'Teacher'
                `),
                executeSingleResultQuery(`
                    SELECT COUNT(*) AS count FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE r.name = 'Student'
                `),
                executeSingleResultQuery('SELECT COUNT(*) AS count FROM users WHERE is_active = 1'),
                executeSingleResultQuery('SELECT COUNT(*) AS count FROM users WHERE is_active = 0'),
                executeSingleResultQuery('SELECT COUNT(*) AS count FROM courses'),
                executeSingleResultQuery('SELECT COUNT(*) AS count FROM payments'),
                executeSingleResultQuery(`
                    SELECT COALESCE(SUM(amount), 0) AS total 
                    FROM payments 
                    WHERE status = 'completed'
                `)
            ]);

            return {
                users: {
                    total: totalUsers?.count || 0,
                    byRole: {
                        admin: admins?.count || 0,
                        teacher: teachers?.count || 0,
                        student: students?.count || 0
                    },
                    byStatus: {
                        active: activeUsers?.count || 0,
                        inactive: inactiveUsers?.count || 0
                    }
                },
                courses: {
                    total: totalCourses?.count || 0,
                    active: 0, // Hardcoded to 0
                    pending: 0, // Hardcoded to 0
                    draft: 0    // Hardcoded to 0
                },
                payments: {
                    total: totalPayments?.count || 0,
                    totalRevenue: totalRevenue?.total || 0
                }
            };
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw error;
        }
    },

    getSystemStatsPage: async (req, res) => {
        try {
            const stats = await adminController.getSystemStats();
            const bodyContent = await renderViewContent('admin/stats', {
                totalUsers: stats.users.total,
                totalCourses: stats.courses.total
            });
            
            res.render('layouts/admin-layout', {
                title: 'System Statistics',
                activePage: 'stats',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('System stats page error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load system statistics.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    getAuditLogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = PAGINATION.AUDIT_LOGS_PER_PAGE;
            const offset = (page - 1) * limit;

            const [{ total }] = await executeQuery('SELECT COUNT(*) as total FROM audit_logs');
            const logs = await executeQuery(`
                SELECT * FROM audit_logs 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const bodyContent = await renderViewContent('admin/auditLogs', {
                logs: logs || [],
                pagination: calculatePagination(total?.total || 0, page, limit)
            });

            res.render('layouts/admin-layout', {
                title: 'Audit Logs',
                activePage: 'audit-logs',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Audit logs error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load audit logs.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    generateReport: async (req, res) => {
        try {
            const reportData = await executeQuery('SELECT * FROM reports ORDER BY created_at DESC');
            const bodyContent = await renderViewContent('admin/reports', { 
                reportData: reportData || [] 
            });
            
            res.render('layouts/admin-layout', {
                title: 'Reports',
                activePage: 'reports',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to generate reports.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    // SETTINGS
    showSettings: async (req, res) => {
        try {
            const bodyContent = await renderViewContent('admin/settings');
            
            res.render('layouts/admin-layout', {
                title: 'Settings',
                activePage: 'settings',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show settings error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load settings.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    updateSettings: async (req, res) => {
        try {
            const { siteName, siteDescription } = req.body;
            if (!siteName || !siteDescription) {
                req.flash('error_msg', 'Site name and description are required');
                return res.redirect('/admin/settings');
            }

            await executeQuery(
                'UPDATE settings SET site_name = ?, site_description = ? WHERE id = 1',
                [siteName, siteDescription]
            );
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_SETTINGS', { siteName, siteDescription });
            req.flash('success_msg', 'Settings updated successfully');
            res.redirect('/admin/settings');
        } catch (error) {
            console.error('Update settings error:', error);
            req.flash('error_msg', 'Error updating settings');
            res.redirect('/admin/settings');
        }
    },

    // USERS
    getAllUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = PAGINATION.USERS_PER_PAGE;
            const offset = (page - 1) * limit;

            const [{ total }] = await executeQuery('SELECT COUNT(*) as total FROM users');
            const users = await executeQuery(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active
                FROM users u 
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.id DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const bodyContent = await renderViewContent('admin/users', {
                users: users || [],
                pagination: calculatePagination(total?.total || 0, page, limit),
                userSession: req.session
            });

            res.render('layouts/admin-layout', {
                title: 'User Management',
                activePage: 'users',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load users.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    showAddUserForm: async (req, res) => {
        try {
            const bodyContent = await renderViewContent('admin/addUser');
            
            res.render('layouts/admin-layout', {
                title: 'Add User',
                activePage: 'users',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show add user form error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load add user form.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    showEditUserForm: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).send('User ID is required');
            }

            const user = await executeSingleResultQuery(`
                SELECT u.id, u.name, u.email, r.name AS role, u.is_active
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `, [id]);

            if (!user) {
                req.flash('error_msg', 'User not found');
                return res.redirect('/admin/users');
            }

            const roles = await executeQuery('SELECT name FROM roles');

            const bodyContent = await renderViewContent('admin/editUser', {
                user,
                roles: roles || [],
                userSession: req.session
            });

            res.render('layouts/admin-layout', {
                title: 'Edit User',
                activePage: 'users',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show edit user form error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load edit user form.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    addUser: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;
            
            if (!name || !email || !password || !role) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect('/admin/users/add');
            }

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

            const roleRow = await executeSingleResultQuery('SELECT id FROM roles WHERE name = ?', [role]);
            if (!roleRow) {
                req.flash('error_msg', 'Invalid role selected');
                return res.redirect('/admin/users/add');
            }

            const result = await executeQuery(
                'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
                [name, email, hashedPassword, roleRow.id]
            );
            
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_USER', { userId: result.insertId, email });
            req.flash('success_msg', 'User created successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Add user error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                req.flash('error_msg', 'Email already exists');
            } else {
                req.flash('error_msg', 'Error creating user');
            }
            res.redirect('/admin/users/add');
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;
            
            if (!id || !name || !email || !role) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect(`/admin/users/edit/${id}`);
            }

            const roleRow = await executeSingleResultQuery('SELECT id FROM roles WHERE name = ?', [role]);
            if (!roleRow) {
                req.flash('error_msg', 'Invalid role selected');
                return res.redirect(`/admin/users/edit/${id}`);
            }

            await executeQuery(
                'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
                [name, email, roleRow.id, id]
            );
            
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_USER', { userId: id, email });
            req.flash('success_msg', 'User updated successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Update user error:', error);
            req.flash('error_msg', 'Error updating user');
            res.redirect(`/admin/users/edit/${req.params.id}`);
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                req.flash('error_msg', 'User ID is required');
                return res.redirect('/admin/users');
            }

            const result = await executeQuery('DELETE FROM users WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                req.flash('error_msg', 'User not found');
                return res.redirect('/admin/users');
            }
            
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_USER', { userId: id });
            req.flash('success_msg', 'User deleted successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Delete user error:', error);
            req.flash('error_msg', 'Error deleting user');
            res.redirect('/admin/users');
        }
    },

    // COURSES
    getAllCourses: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = PAGINATION.COURSES_PER_PAGE;
            const offset = (page - 1) * limit;

            const [{ total }] = await executeQuery('SELECT COUNT(*) as total FROM courses');
            const courses = await executeQuery(`
                SELECT c.id, c.title, c.description, c.status, u.name AS teacher
                FROM courses c
                JOIN users u ON c.teacher_id = u.id
                ORDER BY c.id DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const bodyContent = await renderViewContent('admin/courses', {
                courses: courses || [],
                pagination: calculatePagination(total?.total || 0, page, limit),
                userSession: req.session
            });

            res.render('layouts/admin-layout', {
                title: 'Course Management',
                activePage: 'courses',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Get all courses error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load courses.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    showAddCourseForm: async (req, res) => {
        try {
            const teachers = await executeQuery(`
                SELECT u.id, u.name FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'Teacher' OR r.name = 'instructor'
            `);
            
            const bodyContent = await renderViewContent('admin/addCourse', {
                teachers: teachers || []
            });

            res.render('layouts/admin-layout', {
                title: 'Add Course',
                activePage: 'courses',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show add course form error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load add course form.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    showEditCourseForm: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).send('Course ID is required');
            }

            const course = await executeSingleResultQuery(`
                SELECT c.*, u.name as teacher_name 
                FROM courses c 
                JOIN users u ON c.teacher_id = u.id 
                WHERE c.id = ?
            `, [id]);
            
            if (!course) {
                req.flash('error_msg', 'Course not found');
                return res.redirect('/admin/courses');
            }

            const teachers = await executeQuery(`
                SELECT u.id, u.name FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'Teacher' OR r.name = 'instructor'
            `);

            const bodyContent = await renderViewContent('admin/editCourse', {
                course,
                teachers: teachers || []
            });

            res.render('layouts/admin-layout', {
                title: 'Edit Course',
                activePage: 'courses',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show edit course form error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load course edit form.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    addCourse: async (req, res) => {
        try {
            const { title, description, teacher_id } = req.body;
            
            if (!title || !description || !teacher_id) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect('/admin/courses/add');
            }
            
            const result = await executeQuery(
                'INSERT INTO courses (title, description, teacher_id, status) VALUES (?, ?, ?, ?)',
                [title, description, teacher_id, 'pending']
            );
            
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_COURSE', { courseId: result.insertId, title });
            req.flash('success_msg', 'Course created successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error('Add course error:', error);
            req.flash('error_msg', 'Error creating course');
            res.redirect('/admin/courses/add');
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, teacher_id, status } = req.body;

            if (!id || !title || !description || !teacher_id || !status) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect(`/admin/courses/edit/${id}`);
            }

            await executeQuery(
                'UPDATE courses SET title = ?, description = ?, teacher_id = ?, status = ? WHERE id = ?',
                [title, description, teacher_id, status, id]
            );

            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_COURSE', { courseId: id, title });
            req.flash('success_msg', 'Course updated successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error('Update course error:', error);
            req.flash('error_msg', 'Error updating course');
            res.redirect(`/admin/courses/edit/${req.params.id}`);
        }
    },

    updateCourseStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!id || !status) {
                req.flash('error_msg', 'Course ID and status are required');
                return res.redirect('/admin/courses');
            }
            
            await executeQuery('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
            await auditHelper.logAudit(req.userId, 'ADMIN_UPDATE_COURSE_STATUS', { courseId: id, status });
            req.flash('success_msg', 'Course status updated successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error('Update course status error:', error);
            req.flash('error_msg', 'Error updating course status');
            res.redirect('/admin/courses');
        }
    },

    moderateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!id || !status) {
                req.flash('error_msg', 'Course ID and status are required');
                return res.redirect('/admin/courses');
            }
            
            await executeQuery('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
            await auditHelper.logAudit(req.userId, 'ADMIN_MODERATE_COURSE', { courseId: id, status });
            req.flash('success_msg', 'Course status updated successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error('Moderate course error:', error);
            req.flash('error_msg', 'Error moderating course');
            res.redirect('/admin/courses');
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                req.flash('error_msg', 'Course ID is required');
                return res.redirect('/admin/courses');
            }

            const result = await executeQuery('DELETE FROM courses WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                req.flash('error_msg', 'Course not found');
                return res.redirect('/admin/courses');
            }
            
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_COURSE', { courseId: id });
            req.flash('success_msg', 'Course deleted successfully');
            res.redirect('/admin/courses');
        } catch (error) {
            console.error('Delete course error:', error);
            req.flash('error_msg', 'Error deleting course');
            res.redirect('/admin/courses');
        }
    },

    // ANNOUNCEMENTS
    getAnnouncements: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = PAGINATION.ANNOUNCEMENTS_PER_PAGE;
            const offset = (page - 1) * limit;

            const [{ total }] = await executeQuery('SELECT COUNT(*) as total FROM announcements');
            const announcements = await executeQuery(`
                SELECT * FROM announcements 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const bodyContent = await renderViewContent('admin/announcements', {
                announcements: announcements || [],
                pagination: calculatePagination(total?.total || 0, page, limit)
            });

            res.render('layouts/admin-layout', {
                title: 'Announcements',
                activePage: 'announcements',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Get announcements error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load announcements.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    showAddAnnouncementForm: async (req, res) => {
        try {
            const bodyContent = await renderViewContent('admin/addAnnouncement');
            
            res.render('layouts/admin-layout', {
                title: 'Add Announcement',
                activePage: 'announcements',
                userSession: req.session,
                body: bodyContent,
                ...getFlashMessages(req)
            });
        } catch (error) {
            console.error('Show add announcement form error:', error);
            res.status(500).render('error', {
                title: 'Server Error',
                message: 'Unable to load add announcement form.',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    },

    addAnnouncement: async (req, res) => {
        try {
            const { title, message } = req.body;
            
            if (!title || !message) {
                req.flash('error_msg', 'Title and message are required');
                return res.redirect('/admin/announcements/add');
            }
            
            await executeQuery(
                'INSERT INTO announcements (title, message, created_at) VALUES (?, ?, NOW())',
                [title, message]
            );
            
            await auditHelper.logAudit(req.userId, 'ADMIN_CREATE_ANNOUNCEMENT', { title });
            req.flash('success_msg', 'Announcement created successfully');
            res.redirect('/admin/announcements');
        } catch (error) {
            console.error('Add announcement error:', error);
            req.flash('error_msg', 'Error adding announcement');
            res.redirect('/admin/announcements/add');
        }
    },

    deleteAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                req.flash('error_msg', 'Announcement ID is required');
                return res.redirect('/admin/announcements');
            }

            const result = await executeQuery('DELETE FROM announcements WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                req.flash('error_msg', 'Announcement not found');
                return res.redirect('/admin/announcements');
            }
            
            await auditHelper.logAudit(req.userId, 'ADMIN_DELETE_ANNOUNCEMENT', { id });
            req.flash('success_msg', 'Announcement deleted successfully');
            res.redirect('/admin/announcements');
        } catch (error) {
            console.error('Delete announcement error:', error);
            req.flash('error_msg', 'Error deleting announcement');
            res.redirect('/admin/announcements');
        }
    }
};

module.exports = adminController;