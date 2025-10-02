// app/middlewares/roleMiddleware.js

// Permission matrix - maps roles to allowed actions
const permissions = {
  'Super Admin': [
    'manage_users', 'manage_roles', 'manage_courses', 'manage_subjects',
    'manage_teachers', 'manage_students', 'view_reports', 'manage_payments',
    'view_audit_logs', 'system_settings'
  ],
  'Admin': [
    'manage_courses', 'manage_subjects', 'manage_teachers', 'manage_students',
    'view_reports', 'manage_payments', 'view_audit_logs'
  ],
  'Teacher': [
    'manage_assignments', 'grade_submissions', 'take_attendance',
    'view_student_progress', 'post_announcements'
  ],
  'Student': [
    'view_courses', 'enroll_courses', 'submit_assignments', 'view_grades',
    'view_attendance', 'make_payments'
  ],
  'Finance Officer': [
    'manage_payments', 'view_payment_reports', 'process_refunds'
  ]
};

// Middleware to restrict routes to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.session.roleName) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'No role assigned to your session',
        error: null
      });
    }

    console.log("User role:", req.session.roleName); // Debugging

    if (!roles.includes(req.session.roleName)) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        error: null
      });
    }

    next();
  };
};

// Optional: attach all permissions to locals
exports.getUserPermissions = (req, res, next) => {
  res.locals.userPermissions = req.session.roleName
    ? permissions[req.session.roleName] || []
    : [];
  next();
};
