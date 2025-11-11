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
  `description` TEXT,
  `teacher_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  `due_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SUBMISSIONS TABLE
-- ==========================================
CREATE TABLE `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `grade` VARCHAR(50),
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  `type` ENUM('info','warning','error') DEFAULT 'info',
  `related_id` INT DEFAULT NULL,
  `related_type` VARCHAR(100) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
);

-- ==========================================
-- SAMPLE DATA
-- ==========================================
INSERT INTO `announcements` (`title`, `message`)
VALUES ('Welcome to the LMS', 'This is the first announcement in the system. Stay tuned for more updates.');

INSERT INTO `users` (`name`, `email`, `password`, `role_id`) VALUES
('Admin User', 'admin@example.com', '$2b$10$Ws/hBCP.V.KWe0gGLanaCOC3fKtpZ/I7pKSSnaDHL9BNdMhdxQ8EW', 1),
('Teacher One', 'teacher1@example.com', '$2b$10$YKwlvko52wAoOZzWpf0hH.uTA93hmRFyoV0heeHKfLAZKoVTePeq.', 2),
('Student One', 'student1@example.com', '$2b$10$ju6Akc2NtVAca6tuhkrQseiGJL0Lya38t8UlhfgTMCA5SKHoxRSHW', 3);

INSERT INTO `courses` (`title`, `description`, `teacher_id`, `status`) VALUES
('Mathematics 101', 'Basic Mathematics Course', 2, 'active'),
('History 101', 'Introduction to World History', 2, 'active');

INSERT INTO `assignments` (`course_id`, `teacher_id`, `title`, `description`, `due_date`) VALUES
(1, 2, 'Algebra Homework', 'Solve the following algebraic equations', '2025-10-15 23:59:59'),
(1, 2, 'Geometry Quiz', 'Basic geometry concepts and problems', '2025-10-20 23:59:59');

INSERT INTO `enrollments` (`student_id`, `course_id`, `status`) VALUES
(3, 1, 'active'),
(3, 2, 'active');

INSERT INTO `audit_logs` (`user_id`, `action`, `ip`, `user_agent`)
VALUES
(1, 'login', '127.0.0.1', 'Mozilla/5.0'),
(3, 'course_enrollment', '127.0.0.1', 'Mozilla/5.0');

INSERT INTO `reports` (`teacher_id`, `title`, `description`) VALUES
(2, 'Monthly User Report', 'Summary of user registrations and activity for the month.'),
(2, 'Course Enrollment Report', 'Details of course enrollments and statuses.');

INSERT INTO `submissions` (`assignment_id`, `student_id`, `grade`) VALUES
(1, 3, 'A'),
(2, 3, 'B+');

INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `related_id`, `related_type`) VALUES
(3, 'New Assignment Posted', 'A new assignment "Algebra Homework" has been posted for your course "Mathematics 101".', 'info', 1, 'assignment'),
(3, 'Course Enrollment Approved', 'Your enrollment in the course "Mathematics 101" has been approved.', 'info', 1, 'course');
