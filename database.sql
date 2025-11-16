-- ==========================================
-- EDU-LMS DATABASE RESET AND CLEAN SETUP
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `assignments`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- ROLES TABLE
-- ==========================================
CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`name`) VALUES ('Admin'), ('Teacher'), ('Student');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COURSES TABLE
-- ==========================================
CREATE TABLE `courses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `course_code` VARCHAR(50) NULL,
  `description` TEXT,
  `teacher_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ASSIGNMENTS TABLE
-- ==========================================
CREATE TABLE `assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `teacher_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `instructions` TEXT NULL,
  `due_date` DATETIME DEFAULT NULL,
  `max_points` DECIMAL(5,2) DEFAULT 100.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ENROLLMENTS TABLE
-- ==========================================
CREATE TABLE `enrollments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`student_id`, `course_id`),
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `meta` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- REPORTS TABLE (NO course_id)
-- ==========================================
CREATE TABLE `reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ANNOUNCEMENTS TABLE
-- ==========================================
CREATE TABLE `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SUBMISSIONS TABLE (UPDATED WITH ALL REQUIRED COLUMNS)
-- ==========================================
CREATE TABLE `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `content` TEXT NULL,
  `file_path` VARCHAR(500) NULL,
  `grade` DECIMAL(5,2) NULL,
  `feedback` TEXT NULL,
  `graded_at` TIMESTAMP NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info','warning','error','success') DEFAULT 'info',
  `related_id` INT DEFAULT NULL,
  `related_type` VARCHAR(100) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SETTINGS TABLE
-- ==========================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Edu LMS',
    site_description TEXT,
    site_email VARCHAR(255),
    site_phone VARCHAR(50),
    site_address TEXT,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    max_file_size INT DEFAULT 10485760,
    allowed_file_types VARCHAR(500) DEFAULT 'image/jpeg,image/png,image/gif,application/pdf',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert initial settings
INSERT INTO `settings` (`site_name`, `site_description`, `site_email`) 
VALUES ('Edu LMS', 'A modern Learning Management System', 'admin@edulms.com');

-- Insert announcements
INSERT INTO `announcements` (`title`, `message`)
VALUES 
('Welcome to the LMS', 'This is the first announcement in the system. Stay tuned for more updates.'),
('System Maintenance', 'There will be scheduled maintenance this weekend. The system may be unavailable for 2 hours.');

-- Insert users with proper password hashes (password: password123)
INSERT INTO `users` (`name`, `email`, `password`, `role_id`) VALUES
('Admin User', 'admin@example.com', '$2b$10$Ws/hBCP.V.KWe0gGLanaCOC3fKtpZ/I7pKSSnaDHL9BNdMhdxQ8EW', 1),
('Teacher One', 'teacher1@example.com', '$2b$10$YKwlvko52wAoOZzWpf0hH.uTA93hmRFyoV0heeHKfLAZKoVTePeq.', 2),
('Student One', 'student1@example.com', '$2b$10$ju6Akc2NtVAca6tuhkrQseiGJL0Lya38t8UlhfgTMCA5SKHoxRSHW', 3),
('Student Two', 'student2@example.com', '$2b$10$ju6Akc2NtVAca6tuhkrQseiGJL0Lya38t8UlhfgTMCA5SKHoxRSHW', 3);

-- Insert courses with course codes
INSERT INTO `courses` (`title`, `course_code`, `description`, `teacher_id`, `status`) VALUES
('Mathematics 101', 'MATH101', 'Basic Mathematics Course covering algebra and geometry', 2, 'active'),
('History 101', 'HIST101', 'Introduction to World History from ancient civilizations to modern times', 2, 'active'),
('Computer Science Fundamentals', 'CS101', 'Introduction to programming and computer science concepts', 2, 'active');

-- Insert assignments with full details
INSERT INTO `assignments` (`course_id`, `teacher_id`, `title`, `description`, `instructions`, `due_date`, `max_points`) VALUES
(1, 2, 'Algebra Homework', 'Solve the following algebraic equations', 'Show all your work step by step. Submit your answers in PDF format.', '2025-10-15 23:59:59', 100),
(1, 2, 'Geometry Quiz', 'Basic geometry concepts and problems', 'Answer all questions. Calculators are allowed.', '2025-10-20 23:59:59', 50),
(2, 2, 'Ancient Civilizations Essay', 'Write about the impact of ancient civilizations', 'Minimum 1000 words. Include citations from at least 3 sources.', '2025-10-25 23:59:59', 100);

-- Insert enrollments
INSERT INTO `enrollments` (`student_id`, `course_id`, `status`) VALUES
(3, 1, 'active'),
(3, 2, 'active'),
(4, 1, 'active'),
(4, 3, 'active');

-- Insert audit logs
INSERT INTO `audit_logs` (`user_id`, `action`, `ip`, `user_agent`)
VALUES
(1, 'login', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'create_assignment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'course_enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Insert reports
INSERT INTO `reports` (`teacher_id`, `title`, `description`) VALUES
(2, 'Monthly User Report', 'Summary of user registrations and activity for the month.'),
(2, 'Course Enrollment Report', 'Details of course enrollments and statuses.'),
(2, 'Assignment Completion Report', 'Overview of assignment submissions and grading status.');

-- Insert submissions with complete data
INSERT INTO `submissions` (`assignment_id`, `student_id`, `content`, `grade`, `feedback`, `graded_at`) VALUES
(1, 3, 'I have solved all the algebraic equations as per the instructions. Here are my solutions:\n\n1. 2x + 5 = 15\n   Solution: x = 5\n\n2. 3(x - 4) = 21\n   Solution: x = 11\n\n3. Quadratic equation: x² - 5x + 6 = 0\n   Solution: x = 2, x = 3', 85.00, 'Good work on problems 1 and 3. For problem 2, remember to distribute the 3 before solving. Overall good effort!', NOW()),
(2, 3, 'Geometry quiz answers:\n1. A\n2. C\n3. B\n4. D\n5. A', 92.50, 'Excellent work! You demonstrated strong understanding of geometric concepts.', NOW()),
(1, 4, 'Algebra homework submission:\n\nProblem 1: x = 5\nProblem 2: x = 9\nProblem 3: x = 1, x = 6', NULL, NULL, NULL);

-- Insert notifications
INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `related_id`, `related_type`) VALUES
(3, 'New Assignment Posted', 'A new assignment "Algebra Homework" has been posted for your course "Mathematics 101".', 'info', 1, 'assignment'),
(3, 'Course Enrollment Approved', 'Your enrollment in the course "Mathematics 101" has been approved.', 'success', 1, 'course'),
(3, 'Assignment Graded', 'Your submission for "Algebra Homework" has been graded. You received 85%.', 'info', 1, 'submission'),
(4, 'New Assignment Posted', 'A new assignment "Algebra Homework" has been posted for your course "Mathematics 101".', 'info', 1, 'assignment');

-- Create indexes for better performance
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);