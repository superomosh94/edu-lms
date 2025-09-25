const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Protected routes
router.use(authMiddleware.authenticate);

// Student routes
router.post('/process', 
    roleMiddleware.restrictTo('student'),
    validationMiddleware.validatePayment,
    paymentController.processPayment
);

router.get('/student/history', 
    roleMiddleware.restrictTo('student'),
    paymentController.getPaymentHistory
);

router.get('/student/:id', 
    roleMiddleware.restrictTo('student'),
    paymentController.getPayment
);

// Admin routes
router.get('/admin/all', 
    roleMiddleware.restrictTo('admin'),
    paymentController.getAllPayments
);

router.get('/admin/:id', 
    roleMiddleware.restrictTo('admin'),
    paymentController.getPayment
);

router.post('/admin/:id/refund', 
    roleMiddleware.restrictTo('admin'),
    validationMiddleware.validateRefund,
    paymentController.processRefund
);

module.exports = router;