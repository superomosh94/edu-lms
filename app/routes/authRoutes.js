const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Debug: Check what methods are available
// console.log('🔧 Auth Routes - Available methods:', Object.keys(authController));

// GET routes for rendering pages
router.get('/login', authController.loginView);

router.get('/register', authController.registerView);

router.get('/forgot-password', authController.forgotPasswordView);

router.get('/reset-password/:token', authController.resetPasswordView);

router.get('/logout', authController.logout);

// POST routes for form submissions - Use the correct method names from your authController
router.post('/login', authController.loginPost);
router.post('/register', authController.registerPost);
router.post('/forgot-password', authController.forgotPasswordPost);
router.post('/reset-password/:token', authController.resetPasswordPost);

module.exports = router;