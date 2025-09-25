const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Payment = require('../models/Payment');
const auditHelper = require('../helpers/auditHelper');

const adminController = {
    // Get system statistics
    getSystemStats: async (req, res) => {
        try {
            const stats = {
                users: {
                    total: await User.getCount(),
                    byRole: {
                        admin: await User.getCountByRole('admin'),
                        teacher: await User.getCountByRole('teacher'),
                        student: await User.getCountByRole('student')
                    },
                    byStatus: {
                        active: await User.getCountByStatus('active'),
                        inactive: await User.getCountByStatus('inactive')
                    }
                },
                courses: {
                    total: await Course.getCount(),
                    byStatus: {
                        active: await Course.getCountByStatus('active'),
                        pending: await Course.getCountByStatus('pending'),
                        inactive: await Course.getCountByStatus('inactive')
                    }
                },
                payments: {
                    total: await Payment.getCount(),
                    totalRevenue: await Payment.getTotalRevenue(),
                    byStatus: {
                        completed: await Payment.getCountByStatus('completed'),
                        failed: await Payment.getCountByStatus('failed'),
                        refunded: await Payment.getCountByStatus('refunded')
                    }
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
            const { page = 1, limit = 10, role, status } = req.query;
            const users = await User.findAll({
                page: parseInt(page),
                limit: parseInt(limit),
                role,
                status
            });

            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: await User.getCount({ role, status })
                }
            });
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

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updateData = {};
            if (status) updateData.status = status;
            if (role) updateData.role = role;

            const updatedUser = await User.update(userId, updateData);

            // Log audit trail
            await auditHelper.logAction(req.userId, 'ADMIN_UPDATE_USER', 
                `Updated user ${userId}`, userId);

            res.json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const userId = req.params.id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent self-deletion
            if (userId === req.userId) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            await User.delete(userId);

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
                    report = await User.getRegistrationReport(startDate, endDate);
                    break;
                case 'course-enrollment':
                    report = await Course.getEnrollmentReport(startDate, endDate);
                    break;
                case 'revenue':
                    report = await Payment.getRevenueReport(startDate, endDate);
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