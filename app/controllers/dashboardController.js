const pool = require('./config/db');

// Main dashboard handler — routes based on role
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const roleName = req.session.roleName;
    const userName = req.session.userName || 'User';
    const userAvatar = req.session.userAvatar || '/images/default-avatar.png';

    let dashboardData = {};
    let view = '';
    let pageTitle = '';

    switch (roleName) {
      case 'Super Admin':
        dashboardData = await fetchSuperAdminDashboard();
        view = 'dashboard/admin';
        pageTitle = 'Super Admin Dashboard';
        break;

      case 'Admin':
        dashboardData = await fetchAdminDashboard();
        view = 'dashboard/admin';
        pageTitle = 'Admin Dashboard';
        break;

      case 'Teacher':
        dashboardData = await fetchTeacherDashboard(userId);
        view = 'dashboard/teacher';
        pageTitle = 'Teacher Dashboard';
        break;

      case 'Student':
        dashboardData = await fetchStudentDashboard(userId);
        view = 'dashboard/student';
        pageTitle = 'Student Dashboard';
        break;

      case 'Finance Officer':
        dashboardData = await fetchFinanceDashboard();
        view = 'dashboard/finance';
        pageTitle = 'Finance Officer Dashboard';
        break;

      default:
        dashboardData = { stats: {} };
        view = 'dashboard/default';
        pageTitle = 'Dashboard';
    }

    res.render(view, {
      title: pageTitle,
      role: roleName,
      user: {
        id: userId,
        name: userName,
        role: roleName,
        avatar: userAvatar
      },
      activePage: 'dashboard',
      data: dashboardData,
      stats: dashboardData.stats || {}
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load dashboard.',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};

// Admin dashboard page
exports.showAdminDashboard = async (req, res) => {
  try {
    const data = await fetchAdminDashboard();
    res.render('dashboard/admin', {
      title: 'Admin Dashboard',
      stats: data.stats,
      recentEnrollments: data.recentEnrollments || [],
      recentUsers: data.recentUsers || []
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load admin dashboard.',
      error
    });
  }
};

// Teacher dashboard page
exports.showTeacherDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const data = await fetchTeacherDashboard(userId);

    res.render('dashboard/teacher', {
      title: 'Teacher Dashboard',
      stats: data.stats || {},
      subjects: data.subjects || [],
      assignments: data.assignments || [],
      pendingGrading: data.stats.pendingGrading || 0
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load teacher dashboard.',
      error
    });
  }
};

// Student dashboard page
exports.showStudentDashboard = async (req, res) => {
  try {
    const data = await fetchStudentDashboard(req.session.userId);
    res.render('dashboard/student', {
      title: 'Student Dashboard',
      stats: data.stats
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load student dashboard.',
      error
    });
  }
};

// Finance Officer dashboard page
exports.showFinanceDashboard = async (req, res) => {
  try {
    const data = await fetchFinanceDashboard();
    res.render('dashboard/finance', {
      title: 'Finance Officer Dashboard',
      stats: data.stats,
      recentPayments: data.recentPayments || []
    });
  } catch (error) {
    console.error('Finance dashboard error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load finance dashboard.',
      error
    });
  }
};

/* ------------------------------
   Private helper functions
------------------------------ */

// Super Admin
async function fetchSuperAdminDashboard() {
  const [[userCount]] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [[courseCount]] = await pool.query('SELECT COUNT(*) AS count FROM courses');
  const [[paymentTotal]] = await pool.query("SELECT SUM(amount) AS total FROM payments WHERE status = 'completed'");
  const [recentLogs] = await pool.query(`
    SELECT al.action, al.created_at, u.name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 10
  `);

  return {
    stats: {
      users: userCount.count || 0,
      courses: courseCount.count || 0,
      revenue: paymentTotal.total || 0
    },
    recentActivity: recentLogs || []
  };
}

// Admin
async function fetchAdminDashboard() {
  const studentRoleId = 3;
  const teacherRoleId = 2;

  const [[teacherCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role_id = ?', [teacherRoleId]);
  const [[studentCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role_id = ?', [studentRoleId]);
  const [[courseCount]] = await pool.query('SELECT COUNT(*) AS count FROM courses');
  const [[totalUsers]] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [recentEnrollments] = await pool.query(`
    SELECT e.enrolled_at, u.name AS student_name, c.title AS course_name
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    JOIN courses c ON e.course_id = c.id
    ORDER BY e.enrolled_at DESC
    LIMIT 10
  `);
  const [recentUsers] = await pool.query(`
    SELECT id, name, email, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return {
    stats: {
      totalUsers: totalUsers.count || 0,
      teachers: teacherCount.count || 0,
      students: studentCount.count || 0,
      courses: courseCount.count || 0
    },
    recentEnrollments: recentEnrollments || [],
    recentUsers: recentUsers || []
  };
}

// Teacher
async function fetchTeacherDashboard(userId) {
  const [[subjectCount]] = await pool.query(
    'SELECT COUNT(*) AS count FROM subjects WHERE teacher_id = ?',
    [userId]
  );

  const [[assignmentCount]] = await pool.query(
    'SELECT COUNT(*) AS count FROM assignments WHERE teacher_id = ?',
    [userId]
  );

  const [[pendingSubmissions]] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE a.teacher_id = ? AND s.grade IS NULL
  `, [userId]);

  const [subjects] = await pool.query(`
    SELECT s.id, s.course_id, c.title AS course_title
    FROM subjects s
    JOIN courses c ON s.course_id = c.id
    WHERE s.teacher_id = ?
  `, [userId]);

  const [assignments] = await pool.query(`
    SELECT id, title, due_date
    FROM assignments
    WHERE teacher_id = ?
    ORDER BY due_date DESC
    LIMIT 10
  `, [userId]);

  return {
    stats: {
      subjects: subjectCount.count || 0,
      assignments: assignmentCount.count || 0,
      pendingGrading: pendingSubmissions.count || 0
    },
    subjects: subjects || [],
    assignments: assignments || [],
    pendingGrading: pendingSubmissions.count || 0
  };
}

// Student
async function fetchStudentDashboard(userId) {
  const [[enrollmentCount]] = await pool.query(
    "SELECT COUNT(*) AS count FROM enrollments WHERE student_id = ?",
    [userId]
  );
  const [[assignmentCount]] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM assignments a
    JOIN enrollments e ON a.course_id = e.course_id
    WHERE e.student_id = ?
  `, [userId]);
  const [[completedAssignments]] = await pool.query(
    "SELECT COUNT(*) AS count FROM submissions WHERE student_id = ? AND grade IS NOT NULL",
    [userId]
  );

  return {
    stats: {
      enrollments: enrollmentCount.count || 0,
      assignments: assignmentCount.count || 0,
      completed: completedAssignments.count || 0
    }
  };
}

// Finance Officer
async function fetchFinanceDashboard() {
  const [[totalRevenue]] = await pool.query(
    "SELECT SUM(amount) AS total FROM payments WHERE status = 'completed'"
  );
  const [[pendingPayments]] = await pool.query(
    "SELECT COUNT(*) AS count FROM payments WHERE status = 'pending'"
  );
  const [recentPayments] = await pool.query(`
    SELECT p.amount, p.paid_at, u.name AS student_name, p.method
    FROM payments p
    JOIN users u ON p.student_id = u.id
    ORDER BY p.paid_at DESC
    LIMIT 10
  `);

  return {
    stats: {
      revenue: totalRevenue.total || 0,
      pending: pendingPayments.count || 0
    },
    recentPayments: recentPayments || []
  };
}
