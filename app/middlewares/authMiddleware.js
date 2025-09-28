// app/middlewares/authMiddleware.js
const pool = require('../controllers/config/db');
const crypto = require('crypto');

// Ensure user is authenticated
exports.authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return res.redirect('/auth/login');
};

// Require specific role(s)
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    if (typeof roles === 'string') {
      roles = [roles];
    }

    const userRole = req.session.roleName ? req.session.roleName.toLowerCase() : null;

    // Debugging - remove in production
    console.log("User ID:", req.session.userId, "Role:", userRole);

    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        error: null
      });
    }

    next();
  };
};

// Require active user
exports.requireActiveUser = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT is_active FROM users WHERE id = ?', [req.session.userId]);

    if (!users.length || !users[0].is_active) {
      req.session.destroy(() => {});
      return res.redirect('/auth/login?error=account_inactive');
    }

    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to verify account status.',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};

// CSRF protection middleware
exports.csrfProtection = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};
