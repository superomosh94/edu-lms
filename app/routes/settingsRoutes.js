const express = require('express');
const router = express.Router();
const pool = require('../controllers/config/db'); // Make sure to import pool
const { authenticate, requireActiveUser } = require('../middlewares/authMiddleware');

router.get('/', authenticate, (req, res) => {
  res.render('settings', { title: 'Settings' });
});

router.get('/help', (req, res) => {
  res.render('help', { title: 'Help & Support' });
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    // Get user basic info from database
    const [users] = await pool.query(
      'SELECT id, username, email, first_name, last_name, date_of_birth, phone, address, profile_image, bio, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!users.length) {
      return res.redirect('/auth/login');
    }

    const user = users[0];

    // Get user stats from database
    const [enrolledCourses] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ?',
      [req.session.userId]
    );

    const [completedCourses] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ? AND progress = 100',
      [req.session.userId]
    );

    const [activeCourses] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ? AND progress > 0 AND progress < 100',
      [req.session.userId]
    );

    // Prepare stats object for the template
    const stats = {
      enrolledCourses: enrolledCourses[0].count,
      completedCourses: completedCourses[0].count,
      activeCourses: activeCourses[0].count
    };

    res.render('profile', {
      title: 'Your Profile',
      user: user,
      stats: stats, // This is what your template needs
      currentPage: 'profile'
    });

  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load profile.',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
});

module.exports = router;