const bcrypt = require('bcrypt');
const pool = require('./config/db');
const { logAudit } = require('../helpers/auditHelper');
const { validateEmail, validatePassword, sanitizeInput } = require('../helpers/validationHelper');

exports.loginView = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: null, email: '' });
};

exports.loginPost = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', { title: 'Login', error: 'Email and password are required', email: email || '' });
    }

    if (!validateEmail(email)) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid email address', email });
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
      return res.render('auth/login', { title: 'Login', error: 'Invalid credentials', email });
    }

    const user = users[0];
    if (!user.is_active) {
      await logAudit(null, 'failed_login', { email, reason: 'account_inactive', ip: req.ip });
      return res.render('auth/login', { title: 'Login', error: 'Account is deactivated', email });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await logAudit(null, 'failed_login', { email, reason: 'invalid_password', ip: req.ip });
      return res.render('auth/login', { title: 'Login', error: 'Invalid credentials', email });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.roleId = user.role_id;
    req.session.roleName = user.role_name;
    req.session.email = user.email;

    await logAudit(user.id, 'login', { ip: req.ip, userAgent: req.get('User-Agent') });
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    return res.render('auth/login', { title: 'Login', error: 'Server error. Try again later.', email: req.body.email || '' });
  }
};

exports.registerView = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register', error: null, name: '', email: '' });
};

exports.registerPost = async (req, res) => {
  try {
    let { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.render('auth/register', { title: 'Register', error: 'All fields are required', name, email });
    }

    name = sanitizeInput(name);
    email = email.toLowerCase().trim();

    if (!validateEmail(email)) {
      return res.render('auth/register', { title: 'Register', error: 'Invalid email', name, email });
    }

    if (!validatePassword(password)) {
      return res.render('auth/register', { title: 'Register', error: 'Password must be at least 8 characters with numbers and letters', name, email });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', { title: 'Register', error: 'Passwords do not match', name, email });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (!Array.isArray(existing)) {
      console.error('Invalid query result for existing user check', existing);
      return res.render('auth/register', { title: 'Register', error: 'Server error. Try again later.', name, email });
    }

    if (existing.length > 0) {
      return res.render('auth/register', { title: 'Register', error: 'Email already registered', name, email });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const defaultRoleId = 3; // Student role

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, defaultRoleId]
    );

    await logAudit(result.insertId, 'register', { ip: req.ip });

    req.session.userId = result.insertId;
    req.session.userName = name;
    req.session.roleId = defaultRoleId;
    req.session.roleName = 'Student';
    req.session.email = email;

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    return res.render('auth/register', { title: 'Register', error: 'Server error. Try again later.', name: req.body.name || '', email: req.body.email || '' });
  }
};

exports.logout = async (req, res) => {
  if (req.session.userId) {
    await logAudit(req.session.userId, 'logout', { ip: req.ip });
  }

  req.session.destroy(err => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/auth/login');
  });
};
