const express = require('express');
const router = express.Router();

// Middleware to check if logged in
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

// GET settings page
router.get('/', requireAuth, (req, res) => {
  res.render('settings', {
    title: 'Account Settings',
    user: res.locals.user
  });
});

// POST to update settings (basic example)
router.post('/update', requireAuth, (req, res) => {
  const { name, email, password } = req.body;

  // TODO: Add logic to update user in DB
  console.log('Updated data:', { name, email, password });

  res.redirect('/settings');
});

module.exports = router;
