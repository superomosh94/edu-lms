// ==================================
// Teacher Controller (Fixed Version - No points column)
// ==================================

const pool = require('../controllers/config/db');

// ------------------------------
// Sidebar Menu
// ------------------------------
function getMenu() {
  return [
    { name: "Dashboard", link: "/teacher", icon: "fas fa-tachometer-alt" },
    { name: "Courses", link: "/teacher/courses", icon: "fas fa-book" },
    { name: "Assignments", link: "/teacher/assignments", icon: "fas fa-tasks" },
    { name: "Submissions", link: "/teacher/submissions", icon: "fas fa-file-alt" },
    { name: "Grades", link: "/teacher/grades", icon: "fas fa-clipboard" },
    { name: "Announcements", link: "/teacher/announcements", icon: "fas fa-bullhorn" },
    { name: "Reports", link: "/teacher/reports", icon: "fas fa-chart-line" }
  ];
}

// ------------------------------
// Dashboard
// ------------------------------
async function showTeacherDashboard(req, res) {
  try {
    const userId = req.session.userId;
    const userName = req.session.userName || 'Teacher';
    const role = req.session.roleName || 'Teacher';
    const avatar = req.session.userAvatar || '/images/default-avatar.png';

    const data = await fetchTeacherDashboard(userId);

    res.render('dashboard/teacher', {
      title: 'Teacher Dashboard',
      role,
      user: { id: userId, name: userName, avatar },
      activePage: 'dashboard',
      menu: getMenu(),
      stats: data.stats,
      courses: data.courses,
      assignments: data.assignments
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load dashboard.' });
  }
}

// ------------------------------
// Courses
// ------------------------------
async function showCoursesPage(req, res) {
  try {
    const teacherId = req.session.userId;
    const [courses] = await pool.query(
      `SELECT id, title, description, status, created_at FROM courses WHERE teacher_id = ?`,
      [teacherId]
    );

    res.render('teacher/courses', {
      title: 'My Courses',
      activePage: 'courses',
      menu: getMenu(),
      user: { name: req.session.userName },
      courses
    });
  } catch (error) {
    console.error('Courses error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load courses.' });
  }
}

// ------------------------------
// Create Course Page
// ------------------------------
function showCreateCoursePage(req, res) {
  res.render('teacher/create-course', {
    title: 'Create Course',
    activePage: 'courses',
    menu: getMenu(),
    user: { name: req.session.userName }
  });
}

// ------------------------------
// Create Course POST
// ------------------------------
async function createCourse(req, res) {
  try {
    const { title, description, status } = req.body;
    const teacherId = req.session.userId;

    await pool.query(
      `INSERT INTO courses (title, description, status, teacher_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [title, description, status, teacherId]
    );

    res.redirect('/teacher/courses');
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to create course.' });
  }
}

// ------------------------------
// Assignments (FIXED - No points column)
// ------------------------------
async function showAssignmentsPage(req, res) {
  try {
    const teacherId = req.session.userId;

    // Get teacher's courses
    const [courses] = await pool.query('SELECT id, title FROM courses WHERE teacher_id = ?', [teacherId]);
    
    // Get assignments with submission counts and grading status
    // Using correct column names from your database schema
    const [assignments] = await pool.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.created_at,
              c.title AS course_name, c.id AS course_id,
              (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submissions_count,
              (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.grade IS NULL) AS ungraded_count
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.teacher_id = ?
       ORDER BY a.created_at DESC`,
      [teacherId]
    );

    // Calculate stats for the teacher dashboard
    const stats = {
      total: assignments.length,
      ungraded: assignments.reduce((count, assignment) => {
        return count + (assignment.ungraded_count > 0 ? 1 : 0);
      }, 0),
      dueThisWeek: assignments.filter(assignment => {
        if (!assignment.due_date) return false;
        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate <= oneWeekFromNow && dueDate >= now;
      }).length,
      averageSubmissions: assignments.length > 0 ? 
        Math.round(assignments.reduce((sum, assignment) => {
          // Use a default student count since we don't have course_enrollments
          const totalStudents = 25; // Default class size
          const submissions = assignment.submissions_count || 0;
          return sum + (submissions / totalStudents) * 100;
        }, 0) / assignments.length) : 0
    };

    // Add default values for template compatibility
    assignments.forEach(assignment => {
      assignment.total_students = 25; // Default class size
      assignment.points = 100; // Default points since column doesn't exist
    });

    res.render('teacher/assignments', {
      title: 'Assignments',
      activePage: 'assignments',
      menu: getMenu(),
      user: { 
        name: req.session.userName,
        id: teacherId,
        role: 'teacher'
      },
      courses,
      assignments,
      stats
    });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load assignments.' });
  }
}

// ------------------------------
// Create Assignment Page
// ------------------------------
async function showCreateAssignmentPage(req, res) {
  try {
    const teacherId = req.session.userId;
    const [courses] = await pool.query('SELECT id, title FROM courses WHERE teacher_id = ?', [teacherId]);

    res.render('teacher/create-assignment', {
      title: 'Create Assignment',
      activePage: 'assignments',
      menu: getMenu(),
      user: { name: req.session.userName },
      courses
    });
  } catch (error) {
    console.error('Create Assignment Page error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load create assignment page.' });
  }
}

// ------------------------------
// Create Assignment POST (FIXED - No points parameter)
// ------------------------------
async function createAssignment(req, res) {
  try {
    const { course_id, title, description, due_date } = req.body;
    const teacherId = req.session.userId;

    await pool.query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, due_date, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [course_id, teacherId, title, description, due_date]
    );

    res.redirect('/teacher/assignments');
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to create assignment.' });
  }
}

// ------------------------------
// Edit Assignment Page
// ------------------------------
async function showEditAssignmentPage(req, res) {
  try {
    const assignmentId = req.params.id;
    const teacherId = req.session.userId;
    
    const [courses] = await pool.query('SELECT id, title FROM courses WHERE teacher_id = ?', [teacherId]);
    const [assignments] = await pool.query(
      `SELECT a.*, c.title AS course_name 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = ? AND a.teacher_id = ?`,
      [assignmentId, teacherId]
    );

    if (assignments.length === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Assignment not found.' });
    }

    res.render('teacher/edit-assignment', {
      title: 'Edit Assignment',
      activePage: 'assignments',
      menu: getMenu(),
      user: { name: req.session.userName },
      courses,
      assignment: assignments[0]
    });
  } catch (error) {
    console.error('Edit Assignment Page error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load edit assignment page.' });
  }
}

// ------------------------------
// Update Assignment (FIXED - No points parameter)
// ------------------------------
async function updateAssignment(req, res) {
  try {
    const assignmentId = req.params.id;
    const { course_id, title, description, due_date } = req.body;
    const teacherId = req.session.userId;

    // Verify the assignment belongs to the teacher
    const [assignments] = await pool.query(
      'SELECT id FROM assignments WHERE id = ? AND teacher_id = ?',
      [assignmentId, teacherId]
    );

    if (assignments.length === 0) {
      return res.status(403).render('error', { title: 'Access Denied', message: 'Cannot update this assignment.' });
    }

    await pool.query(
      `UPDATE assignments 
       SET course_id = ?, title = ?, description = ?, due_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [course_id, title, description, due_date, assignmentId]
    );

    res.redirect('/teacher/assignments');
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to update assignment.' });
  }
}

// ------------------------------
// Delete Assignment
// ------------------------------
async function deleteAssignment(req, res) {
  try {
    const assignmentId = req.params.id;
    const teacherId = req.session.userId;

    // Verify the assignment belongs to the teacher
    const [assignments] = await pool.query(
      'SELECT id FROM assignments WHERE id = ? AND teacher_id = ?',
      [assignmentId, teacherId]
    );

    if (assignments.length === 0) {
      return res.status(403).render('error', { title: 'Access Denied', message: 'Cannot delete this assignment.' });
    }

    await pool.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);

    res.redirect('/teacher/assignments');
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to delete assignment.' });
  }
}

// ------------------------------
// View Assignment (for teacher)
// ------------------------------
async function viewAssignment(req, res) {
  try {
    const assignmentId = req.params.id;
    const teacherId = req.session.userId;

    const [assignments] = await pool.query(
      `SELECT a.*, c.title AS course_name 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = ? AND a.teacher_id = ?`,
      [assignmentId, teacherId]
    );

    if (assignments.length === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Assignment not found.' });
    }

    // Get submissions for this assignment
    const [submissions] = await pool.query(
      `SELECT s.*, u.name AS student_name 
       FROM submissions s 
       JOIN users u ON s.student_id = u.id 
       WHERE s.assignment_id = ? 
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    res.render('teacher/view-assignment', {
      title: assignments[0].title,
      activePage: 'assignments',
      menu: getMenu(),
      user: { name: req.session.userName },
      assignment: assignments[0],
      submissions
    });
  } catch (error) {
    console.error('View assignment error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load assignment.' });
  }
}

// ------------------------------
// Submissions
// ------------------------------
async function showSubmissionsPage(req, res) {
  try {
    const teacherId = req.session.userId;
    const [submissions] = await pool.query(
      `SELECT s.id, u.name AS student_name, s.submitted_at, s.grade, 
              a.title AS assignment_title, c.title AS course_name
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE c.teacher_id = ?
       ORDER BY s.submitted_at DESC`,
      [teacherId]
    );

    res.render('teacher/submissions', {
      title: 'Submissions',
      activePage: 'submissions',
      menu: getMenu(),
      user: { name: req.session.userName },
      submissions
    });
  } catch (error) {
    console.error('Submissions error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load submissions.' });
  }
}

// ------------------------------
// Submission Details
// ------------------------------
async function getSubmission(req, res) {
  try {
    const submissionId = req.params.id;
    const [result] = await pool.query(
      `SELECT s.id, s.grade, s.submitted_at, s.content, u.name AS student_name, 
              a.title AS assignment_title, a.description, c.title AS course_name
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE s.id = ?`,
      [submissionId]
    );

    if (!result.length) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Submission not found.' });
    }

    res.render('teacher/submission-detail', {
      title: 'Submission Details',
      activePage: 'submissions',
      menu: getMenu(),
      user: { name: req.session.userName },
      submission: result[0]
    });
  } catch (error) {
    console.error('Submission detail error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load submission details.' });
  }
}

// ------------------------------
// Grade Submission
// ------------------------------
async function gradeSubmission(req, res) {
  try {
    const submissionId = req.params.id;
    const { grade } = req.body;

    if (!grade) {
      return res.status(400).render('error', { title: 'Invalid Input', message: 'Grade is required.' });
    }

    await pool.query(`UPDATE submissions SET grade = ?, graded_at = NOW() WHERE id = ?`, [grade, submissionId]);

    res.redirect('/teacher/submissions');
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to grade submission.' });
  }
}

// ------------------------------
// Grades
// ------------------------------
async function showGradesPage(req, res) {
  try {
    const teacherId = req.session.userId;
    const [grades] = await pool.query(
      `SELECT s.id, u.name AS student_name, c.title AS course_name, 
              a.title AS assignment_title, s.grade, s.submitted_at AS created_at
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE a.teacher_id = ?
       ORDER BY s.submitted_at DESC`,
      [teacherId]
    );

    res.render('teacher/grades', {
      title: 'Gradebook',
      activePage: 'grades',
      menu: getMenu(),
      user: { name: req.session.userName },
      grades
    });
  } catch (error) {
    console.error('Grades error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load grades.' });
  }
}

// ------------------------------
// Announcements
// ------------------------------
async function showAnnouncementsPage(req, res) {
  try {
    const [announcements] = await pool.query(
      `SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC`
    );

    res.render('teacher/announcements', {
      title: 'Announcements',
      activePage: 'announcements',
      menu: getMenu(),
      user: { name: req.session.userName },
      announcements
    });
  } catch (error) {
    console.error('Announcements error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load announcements.' });
  }
}

async function sendAnnouncement(req, res) {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).render('error', { title: 'Invalid Input', message: 'Title and message are required.' });
    }

    await pool.query(`INSERT INTO announcements (title, message, created_at) VALUES (?, ?, NOW())`, [title, message]);
    res.redirect('/teacher/announcements');
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to post announcement.' });
  }
}

// ------------------------------
// Reports
// ------------------------------
async function showReportsPage(req, res) {
  try {
    const teacherId = req.session.userId;
    const selectedCourse = req.query.course || null;

    const [courses] = await pool.query(`SELECT id, title FROM courses WHERE teacher_id = ?`, [teacherId]);

    let reportsQuery = `
      SELECT r.id, r.title, r.description, r.created_at
      FROM reports r
      WHERE r.teacher_id = ?`;
    const queryParams = [teacherId];

    reportsQuery += ` ORDER BY r.created_at DESC`;

    const [reports] = await pool.query(reportsQuery, queryParams);

    res.render('teacher/reports', {
      title: 'Reports',
      activePage: 'reports',
      menu: getMenu(),
      user: { name: req.session.userName },
      courses,
      reports,
      selectedCourse
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Unable to load reports.' });
  }
}

// ------------------------------
// Dashboard Helper
// ------------------------------
async function fetchTeacherDashboard(userId) {
  const [[courseCount]] = await pool.query('SELECT COUNT(*) AS count FROM courses WHERE teacher_id = ?', [userId]);
  const [[assignmentCount]] = await pool.query('SELECT COUNT(*) AS count FROM assignments WHERE teacher_id = ?', [userId]);
  const [[pendingCount]] = await pool.query(
    `SELECT COUNT(*) AS count FROM submissions s 
     JOIN assignments a ON s.assignment_id = a.id 
     WHERE a.teacher_id = ? AND s.grade IS NULL`,
    [userId]
  );

  const [courses] = await pool.query('SELECT id, title, created_at FROM courses WHERE teacher_id = ?', [userId]);
  const [assignments] = await pool.query(
    `SELECT id, title, due_date FROM assignments WHERE teacher_id = ? ORDER BY due_date DESC LIMIT 10`,
    [userId]
  );

  return {
    stats: {
      courses: courseCount.count,
      assignments: assignmentCount.count,
      pendingGrading: pendingCount.count
    },
    courses,
    assignments
  };
}

// ------------------------------
// Exports
// ------------------------------
module.exports = {
  showTeacherDashboard,
  showCoursesPage,
  showCreateCoursePage,
  createCourse,
  showAssignmentsPage,
  showCreateAssignmentPage,
  createAssignment,
  showEditAssignmentPage,
  updateAssignment,
  deleteAssignment,
  viewAssignment,
  showSubmissionsPage,
  getSubmission,
  gradeSubmission,
  showGradesPage,
  showAnnouncementsPage,
  sendAnnouncement,
  showReportsPage
};