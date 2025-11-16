const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('./config/db');
const User = require('../models/User');
const { logAudit } = require('../helpers/auditHelper');
const { validateEmail, validatePassword, sanitizeInput } = require('../helpers/validationHelper');

// Login
const loginView = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/login', { 
    title: 'Login', 
    error: null, 
    email: '',
    messages: {
      error: req.query.error,
      success: req.query.success,
      warning: req.query.warning
    }
  });
};

const loginPost = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Handle both traditional form submission and AJAX
    const isAjax = req.headers['content-type']?.includes('application/json');

    if (!email || !password) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Email and password are required', 
        email: email || '' 
      });
    }

    if (!validateEmail(email)) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid email address' 
        });
      }
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid email address', 
        email 
      });
    }

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.is_active, r.id AS role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!Array.isArray(users) || users.length === 0) {
      await logAudit(null, 'failed_login', { email, reason: 'user_not_found', ip: req.ip });
      
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid credentials', 
        email 
      });
    }

    const user = users[0];
    if (!user.is_active) {
      await logAudit(null, 'failed_login', { email, reason: 'account_inactive', ip: req.ip });
      
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Account is deactivated' 
        });
      }
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Account is deactivated', 
        email 
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await logAudit(null, 'failed_login', { email, reason: 'invalid_password', ip: req.ip });
      
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid credentials', 
        email 
      });
    }

    // For AJAX requests, return JSON with JWT token
    if (isAjax) {
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role_name,
          name: user.name
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: rememberMe ? '7d' : '24h' }
      );

      await logAudit(user.id, 'login', { ip: req.ip, userAgent: req.get('User-Agent'), method: 'ajax' });
      
      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name
        }
      });
    }

    // For traditional form submission, use sessions
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.roleId = user.role_id;
    req.session.roleName = user.role_name;
    req.session.email = user.email;

    await logAudit(user.id, 'login', { ip: req.ip, userAgent: req.get('User-Agent'), method: 'session' });
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    
    if (req.headers['content-type']?.includes('application/json')) {
      return res.json({ 
        success: false, 
        message: 'Server error. Try again later.' 
      });
    }
    return res.render('auth/login', { 
      title: 'Login', 
      error: 'Server error. Try again later.', 
      email: req.body.email || '' 
    });
  }
};

// Register
const registerView = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/register', { 
    title: 'Register', 
    error: null, 
    name: '', 
    email: '',
    messages: {
      error: req.query.error,
      success: req.query.success
    }
  });
};

const registerPost = async (req, res) => {
  try {
    let { name, email, password, confirmPassword } = req.body;

    // Handle both traditional form submission and AJAX
    const isAjax = req.headers['content-type']?.includes('application/json');

    if (!name || !email || !password || !confirmPassword) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'All fields are required', 
        name, 
        email 
      });
    }

    name = sanitizeInput(name);
    email = email.toLowerCase().trim();

    if (!validateEmail(email)) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid email address' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Invalid email', 
        name, 
        email 
      });
    }

    if (!validatePassword(password)) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Password must be at least 8 characters with numbers and letters' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Password must be at least 8 characters with numbers and letters', 
        name, 
        email 
      });
    }

    if (password !== confirmPassword) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Passwords do not match' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Passwords do not match', 
        name, 
        email 
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (!Array.isArray(existing)) {
      console.error('Invalid query result for existing user check', existing);
      
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Server error. Try again later.' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Server error. Try again later.', 
        name, 
        email 
      });
    }

    if (existing.length > 0) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Email already registered', 
        name, 
        email 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const defaultRoleId = 3; // Student role

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, defaultRoleId]
    );

    await logAudit(result.insertId, 'register', { ip: req.ip });

    // For AJAX requests, return JSON
    if (isAjax) {
      const token = jwt.sign(
        { 
          userId: result.insertId, 
          email: email, 
          role: 'Student',
          name: name
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: result.insertId,
          name: name,
          email: email,
          role: 'Student'
        }
      });
    }

    // For traditional form submission, use sessions
    req.session.userId = result.insertId;
    req.session.userName = name;
    req.session.roleId = defaultRoleId;
    req.session.roleName = 'Student';
    req.session.email = email;

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    
    if (req.headers['content-type']?.includes('application/json')) {
      return res.json({ 
        success: false, 
        message: 'Server error. Try again later.' 
      });
    }
    return res.render('auth/register', { 
      title: 'Register', 
      error: 'Server error. Try again later.', 
      name: req.body.name || '', 
      email: req.body.email || '' 
    });
  }
};

// Forgot Password
const forgotPasswordView = (req, res) => {
  res.render('auth/forgot-password', { 
    title: 'Forgot Password',
    messages: {
      error: req.query.error,
      success: req.query.success
    }
  });
};

const forgotPasswordPost = async (req, res) => {
  try {
    const { email } = req.body;
    const isAjax = req.headers['content-type']?.includes('application/json');

    if (!email) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Email is required' 
        });
      }
      return res.render('auth/forgot-password', { 
        title: 'Forgot Password',
        messages: { error: 'Email is required' }
      });
    }

    if (!validateEmail(email)) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid email address' 
        });
      }
      return res.render('auth/forgot-password', { 
        title: 'Forgot Password',
        messages: { error: 'Invalid email address' }
      });
    }

    // Find user by email
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email 
       FROM users u 
       WHERE u.email = ? AND u.is_active = 1`,
      [email.toLowerCase().trim()]
    );

    // Don't reveal whether email exists for security
    if (!Array.isArray(users) || users.length === 0) {
      console.log('Password reset requested for non-existent email:', email);
      
      if (isAjax) {
        return res.json({ 
          success: true, 
          message: 'If an account with this email exists, a reset link will be sent.' 
        });
      }
      return res.render('auth/forgot-password', { 
        title: 'Forgot Password',
        messages: { 
          success: 'If an account with this email exists, a reset link will be sent.' 
        }
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await User.createPasswordResetToken(user.id, resetToken, resetTokenExpires);

    // Construct reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
    
    // Log for development (replace with actual email in production)
    console.log('Password reset URL for', user.email, ':', resetUrl);

    await logAudit(user.id, 'password_reset_requested', { ip: req.ip });

    if (isAjax) {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a reset link will be sent.'
      });
    }

    return res.render('auth/forgot-password', { 
      title: 'Forgot Password',
      messages: { 
        success: 'If an account with this email exists, a reset link will be sent.' 
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (req.headers['content-type']?.includes('application/json')) {
      return res.json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
    return res.render('auth/forgot-password', { 
      title: 'Forgot Password',
      messages: { error: 'Server error. Please try again.' }
    });
  }
};

// Reset Password
const resetPasswordView = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify the token is valid
    const userData = await User.findByResetToken(token);
    if (!userData) {
      return res.redirect('/auth/forgot-password?error=Invalid or expired reset token');
    }

    res.render('auth/reset-password', { 
      title: 'Reset Password',
      token: token,
      messages: {
        error: req.query.error
      }
    });

  } catch (error) {
    console.error('Reset password view error:', error);
    return res.redirect('/auth/forgot-password?error=Invalid token');
  }
};

const resetPasswordPost = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    const isAjax = req.headers['content-type']?.includes('application/json');

    if (!password || !confirmPassword) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }
      return res.render('auth/reset-password', { 
        title: 'Reset Password',
        token,
        messages: { error: 'All fields are required' }
      });
    }

    if (password !== confirmPassword) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Passwords do not match' 
        });
      }
      return res.render('auth/reset-password', { 
        title: 'Reset Password',
        token,
        messages: { error: 'Passwords do not match' }
      });
    }

    if (!validatePassword(password)) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Password must be at least 8 characters with numbers and letters' 
        });
      }
      return res.render('auth/reset-password', { 
        title: 'Reset Password',
        token,
        messages: { error: 'Password must be at least 8 characters with numbers and letters' }
      });
    }

    // Find user by valid reset token
    const userData = await User.findByResetToken(token);
    if (!userData) {
      if (isAjax) {
        return res.json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }
      return res.render('auth/reset-password', { 
        title: 'Reset Password',
        token,
        messages: { error: 'Invalid or expired reset token' }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token as used
    await User.updatePassword(userData.user_id, hashedPassword);
    await User.markTokenAsUsed(token);

    await logAudit(userData.user_id, 'password_reset_success', { ip: req.ip });

    if (isAjax) {
      return res.json({
        success: true,
        message: 'Password reset successfully! You can now login with your new password.'
      });
    }

    return res.redirect('/auth/login?success=Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    
    if (req.headers['content-type']?.includes('application/json')) {
      return res.json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
    return res.render('auth/reset-password', { 
      title: 'Reset Password',
      token: req.params.token,
      messages: { error: 'Server error. Please try again.' }
    });
  }
};

// Logout
const logout = async (req, res) => {
  if (req.session.userId) {
    await logAudit(req.session.userId, 'logout', { ip: req.ip });
  }

  req.session.destroy(err => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/auth/login');
  });
};

// Export all functions
module.exports = {
  loginView,
  loginPost,
  registerView,
  registerPost,
  forgotPasswordView,
  forgotPasswordPost,
  resetPasswordView,
  resetPasswordPost,
  logout
};