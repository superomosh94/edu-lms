const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const courseRoutes = require('./courseRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const staticRoutes = require('./staticRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/', staticRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Catch-all route for undefined API endpoints
router.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

module.exports = router;
