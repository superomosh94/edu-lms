const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "https:", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https:", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  })
);

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 9000,
  message: 'Too many login attempts, please try again later.'
});

// Body parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

// Static files
app.use('/public', express.static(path.join(__dirname, 'app', 'public')));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    },
    name: 'edulms.sid'
  })
);

// Expose session user to views
app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? {
        id: req.session.userId,
        name: req.session.userName,
        role: req.session.roleId,
        roleName: req.session.roleName
      }
    : null;
  next();
});

// Import routes

const gradesRoutes = require('./app/routes/grades');
app.use('/grades', gradesRoutes);


const authRoutes = require('./app/routes/authRoutes');
const dashboardRoutes = require('./app/routes/dashboardRoutes');
const courseRoutes = require('./app/routes/courseRoutes');
const assignmentRoutes = require('./app/routes/assignmentRoutes');

// Use routes
app.use('/auth', authLimiter, authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/courses', courseRoutes);
app.use('/assignments', assignmentRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }

  res.render('index', {
    title: 'EDU LMS - Home',
    userStats: {
      enrolledCourses: 0,
      pendingAssignments: 0,
      averageGrade: 'N/A',
      upcomingDeadlines: 0
    },
    recentActivity: []
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong. Please try again later.',
    error: process.env.NODE_ENV === 'development' ? err : null
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ EDU LMS server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
