const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/', authenticate, (req, res) => {
  res.render('settings', { title: 'Settings' });
});

router.get('/help', (req, res) => {
  res.render('help', { title: 'Help & Support' });
});

router.get('/profile', authenticate, (req, res) => {
  res.render('profile', {
    title: 'Your Profile',
    user: res.locals.user
  });
});

module.exports = router;
