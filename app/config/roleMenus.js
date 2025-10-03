module.exports = {
  Admin: [
    { label: "Dashboard", icon: "tachometer-alt", url: "/dashboard", page: "dashboard" },
    { label: "User Management", icon: "users-cog", url: "/admin/users", page: "users" },
    { label: "Course Management", icon: "book", url: "/admin/courses", page: "courses" },
    { label: "Reports", icon: "chart-bar", url: "/admin/reports", page: "reports" },
    { label: "System Stats", icon: "chart-pie", url: "/admin/stats", page: "stats" },
    { label: "Announcements", icon: "bullhorn", url: "/admin/announcements", page: "announcements" },
    { label: "Audit Logs", icon: "file-alt", url: "/admin/audit-logs", page: "audit-logs" },
    { label: "Settings", icon: "sliders-h", url: "/admin/settings", page: "settings" },
    { label: "System Settings", icon: "cogs", url: "/admin/system", page: "system" }
  ],
  Teacher: [
    { label: "Dashboard", icon: "tachometer-alt", url: "/teacher", page: "dashboard" },
    { label: "My Courses", icon: "chalkboard-teacher", url: "/teacher/courses", page: "courses" },
    { label: "Assignments", icon: "tasks", url: "/teacher/assignments", page: "assignments" },
    { label: "Student Submissions", icon: "folder-open", url: "/teacher/submissions", page: "submissions" },
    { label: "Gradebook", icon: "clipboard-check", url: "/teacher/grades", page: "grades" },
    { label: "Announcements", icon: "bullhorn", url: "/teacher/announcements", page: "announcements" },
    { label: "Reports", icon: "chart-line", url: "/teacher/reports", page: "reports" }
  ],
  Student: [
    { label: "Dashboard", icon: "tachometer-alt", url: "/student/dashboard", page: "dashboard" },
    { label: "Enrolled Courses", icon: "book-open", url: "/student/courses", page: "courses" },
    { label: "Enroll", icon: "user-plus", url: "/student/enroll", page: "enroll" },
    { label: "Assignments", icon: "pencil-alt", url: "/student/assignments", page: "assignments" },
    { label: "My Submissions", icon: "upload", url: "/student/submissions", page: "submissions" },
    { label: "My Grades", icon: "chart-line", url: "/student/grades", page: "grades" },
    { label: "Recommendations", icon: "lightbulb", url: "/student/recommendations", page: "recommendations" },
    { label: "Notifications", icon: "bell", url: "/student/notifications", page: "notifications" },
    { label: "Profile", icon: "user", url: "/settings/profile", page: "profile" }
  ],
  Finance: [
    { label: "Dashboard", icon: "tachometer-alt", url: "/dashboard/finance", page: "dashboard" },
    { label: "Payments", icon: "credit-card", url: "/finance/payments", page: "payments" },
    { label: "Invoices", icon: "file-invoice-dollar", url: "/finance/invoices", page: "invoices" },
    { label: "Financial Reports", icon: "receipt", url: "/finance/reports", page: "reports" }
  ]
};
