const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { csrfProtection } = require('../middlewares/authMiddleware');

// Apply CSRF protection to all routes
router.use(csrfProtection);

// Login routes
router.get('/login', authController.loginView);
router.post('/login', authController.loginPost);

// Register routes
router.get('/register', authController.registerView);
router.post('/register', authController.registerPost);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;
