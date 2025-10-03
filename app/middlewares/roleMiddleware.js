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

// Menu configuration per role
const menuConfig = {
  'Super Admin': [
    { label: 'Dashboard', url: '/dashboard', page: 'dashboard', icon: 'tachometer-alt' },
    { label: 'User Management', url: '/admin/users', page: 'users', icon: 'users-cog' },
    { label: 'Course Management', url: '/admin/courses', page: 'courses', icon: 'book' },
    { label: 'Reports', url: '/admin/reports', page: 'reports', icon: 'chart-bar' },
    { label: 'System Stats', url: '/admin/stats', page: 'stats', icon: 'chart-pie' },
    { label: 'Announcements', url: '/admin/announcements', page: 'announcements', icon: 'bullhorn' },
    { label: 'Audit Logs', url: '/admin/audit-logs', page: 'audit-logs', icon: 'file-alt' },
    { label: 'Settings', url: '/admin/settings', page: 'settings', icon: 'sliders-h' },
    { label: 'System Settings', url: '/admin/system', page: 'system', icon: 'cogs' }
  ],
  'Admin': [
    { label: 'Dashboard', url: '/dashboard', page: 'dashboard', icon: 'tachometer-alt' },
    { label: 'Course Management', url: '/admin/courses', page: 'courses', icon: 'book' },
    { label: 'Reports', url: '/admin/reports', page: 'reports', icon: 'chart-bar' },
    { label: 'Audit Logs', url: '/admin/audit-logs', page: 'audit-logs', icon: 'file-alt' }
  ],
  'Teacher': [
    { label: 'Dashboard', url: '/teacher', page: 'dashboard', icon: 'tachometer-alt' },
    { label: 'My Courses', url: '/teacher/courses', page: 'courses', icon: 'chalkboard-teacher' },
    { label: 'Assignments', url: '/teacher/assignments', page: 'assignments', icon: 'tasks' },
    { label: 'Submissions', url: '/teacher/submissions', page: 'submissions', icon: 'folder-open' },
    { label: 'Gradebook', url: '/teacher/grades', page: 'grades', icon: 'clipboard-check' },
    { label: 'Announcements', url: '/teacher/announcements', page: 'announcements', icon: 'bullhorn' },
    { label: 'Reports', url: '/teacher/reports', page: 'reports', icon: 'chart-line' }
  ],
  'Student': [
    { label: 'Dashboard', url: '/dashboard', page: 'dashboard', icon: 'tachometer-alt' },
    { label: 'Enrolled Courses', url: '/student/courses', page: 'courses', icon: 'book-open' },
    { label: 'Enroll', url: '/student/enroll', page: 'enroll', icon: 'user-plus' },
    { label: 'Assignments', url: '/student/assignments', page: 'assignments', icon: 'pencil-alt' },
    { label: 'My Submissions', url: '/student/submissions', page: 'submissions', icon: 'upload' },
    { label: 'My Grades', url: '/student/grades', page: 'grades', icon: 'chart-line' },
    { label: 'Recommendations', url: '/student/recommendations', page: 'recommendations', icon: 'lightbulb' },
    { label: 'Notifications', url: '/student/notifications', page: 'notifications', icon: 'bell' },
    { label: 'Profile', url: '/settings/profile', page: 'profile', icon: 'user' }
  ],
  'Finance Officer': [
    { label: 'Dashboard', url: '/dashboard/finance', page: 'dashboard', icon: 'tachometer-alt' },
    { label: 'Payments', url: '/finance/payments', page: 'payments', icon: 'credit-card' },
    { label: 'Invoices', url: '/finance/invoices', page: 'invoices', icon: 'file-invoice-dollar' },
    { label: 'Financial Reports', url: '/finance/reports', page: 'reports', icon: 'receipt' }
  ]
};

// Restrict access to roles (case-insensitive)
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    let roleName = req.session.roleName || (req.user && req.user.role);

    if (!roleName) {
      console.error("Access denied: No role found in session or request");
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'No role assigned to your session',
        error: null
      });
    }

    roleName = roleName.trim().toLowerCase();

    const allowed = allowedRoles.some(role => role.trim().toLowerCase() === roleName);

    console.log("Role check:", roleName, allowedRoles, allowed);

    if (!allowed) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        error: null
      });
    }

    next();
  };
};

// Attach permissions to locals
exports.getUserPermissions = (req, res, next) => {
  let roleName = req.session.roleName || (req.user && req.user.role);
  roleName = roleName ? roleName.trim() : null;
  res.locals.userPermissions = roleName ? permissions[roleName] || [] : [];
  next();
};

// Attach global variables including menuItems
exports.setGlobals = (req, res, next) => {
  let roleName = req.session.roleName || (req.user && req.user.role);
  roleName = roleName ? roleName.trim() : null;

  res.locals.user = req.session.user || req.user || null;
  res.locals.roleName = roleName;
  res.locals.activePage = req.path.split('/')[1] || '';
  res.locals.userPermissions = roleName ? permissions[roleName] || [] : [];
  res.locals.menuItems = roleName ? menuConfig[roleName] || [] : [];

  next();
};
