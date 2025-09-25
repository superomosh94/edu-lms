const Payment = require('../models/Payment');
const Course = require('../models/Course');
const auditHelper = require('../helpers/auditHelper');
const validationHelper = require('../helpers/validationHelper');

// Mock payment processor (replace with actual payment gateway)
const mockPaymentProcessor = {
    processPayment: async (paymentData) => {
        // Simulate payment processing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: Math.random() > 0.1, // 90% success rate
                    transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
                    message: 'Payment processed successfully'
                });
            }, 1000);
        });
    }
};

const paymentController = {
    // Process course payment
    processPayment: async (req, res) => {
        try {
            const { courseId, paymentMethod, amount } = req.body;
            const studentId = req.userId;

            // Validate input
            const validation = validationHelper.validatePayment(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ error: validation.errors });
            }

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            // Check if already enrolled
            const isEnrolled = await Course.isStudentEnrolled(courseId, studentId);
            if (isEnrolled) {
                return res.status(400).json({ error: 'Already enrolled in this course' });
            }

            // Process payment
            const paymentResult = await mockPaymentProcessor.processPayment({
                amount: course.price,
                currency: 'USD',
                paymentMethod,
                studentId,
                courseId
            });

            // Record payment
            const paymentRecord = await Payment.create({
                studentId,
                courseId,
                amount: course.price,
                paymentMethod,
                status: paymentResult.success ? 'completed' : 'failed',
                transactionId: paymentResult.transactionId,
                paymentDate: new Date()
            });

            // Enroll student if payment successful
            if (paymentResult.success) {
                await Course.enrollStudent(courseId, studentId);
            }

            // Log audit trail
            await auditHelper.logAction(studentId, 'PAYMENT_PROCESS', 
                `Payment ${paymentResult.success ? 'successful' : 'failed'} for course: ${course.title}`,
                courseId);

            res.json({
                success: paymentResult.success,
                message: paymentResult.message,
                payment: paymentRecord
            });
        } catch (error) {
            console.error('Payment processing error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get payment history for student
    getPaymentHistory: async (req, res) => {
        try {
            const studentId = req.userId;
            const payments = await Payment.findByStudent(studentId);

            res.json({ payments });
        } catch (error) {
            console.error('Get payment history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get all payments (admin only)
    getAllPayments: async (req, res) => {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const payments = await Payment.findAll({
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            res.json({
                payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: await Payment.getCount({ status })
                }
            });
        } catch (error) {
            console.error('Get all payments error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get payment by ID
    getPayment: async (req, res) => {
        try {
            const payment = await Payment.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            // Check permission (student can only see their own payments)
            if (req.userRole === 'student' && payment.studentId !== req.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ payment });
        } catch (error) {
            console.error('Get payment error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Refund payment (admin only)
    processRefund: async (req, res) => {
        try {
            const paymentId = req.params.id;
            const { reason } = req.body;

            const payment = await Payment.findById(paymentId);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            if (payment.status !== 'completed') {
                return res.status(400).json({ error: 'Only completed payments can be refunded' });
            }

            // Process refund (mock implementation)
            const refundResult = await mockPaymentProcessor.processRefund({
                transactionId: payment.transactionId,
                amount: payment.amount,
                reason
            });

            // Update payment status
            await Payment.updateStatus(paymentId, 'refunded');

            // Log audit trail
            await auditHelper.logAction(req.userId, 'PAYMENT_REFUND', 
                `Refund processed for payment ${paymentId}`, paymentId);

            res.json({
                success: true,
                message: 'Refund processed successfully',
                refund: refundResult
            });
        } catch (error) {
            console.error('Refund processing error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = paymentController;