const express = require('express');
const router = express.Router();
const pool = require('../controllers/config/db');
const { authenticate, requireActiveUser } = require('../middlewares/authMiddleware');

router.get('/', authenticate, (req, res) => {
  res.render('settings', { title: 'Settings' });
});

router.get('/help', (req, res) => {
  res.render('help', { title: 'Help & Support' });
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    // Get user basic info from database - using 'name' instead of 'username'
    const [users] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!users.length) {
      return res.redirect('/auth/login');
    }

    const user = users[0];

    // Get user stats from database
    const [enrolledCourses] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?',
      [req.session.userId]
    );

    const [completedCourses] = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments e 
       WHERE e.student_id = ?`,
      [req.session.userId]
    );

    const [activeCourses] = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments e 
       WHERE e.student_id = ? AND e.status = 'active'`,
      [req.session.userId]
    );

    // Prepare stats object for the template
    const stats = {
      enrolledCourses: enrolledCourses[0].count || 0,
      completedCourses: completedCourses[0].count || 0,
      activeCourses: activeCourses[0].count || 0
    };

    res.render('profile', {
      title: 'Your Profile',
      user: user,
      stats: stats,
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