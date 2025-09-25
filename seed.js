require('dotenv').config();
const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');

async function recreateTables(connection) {
  const sql = `
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS submissions;
    DROP TABLE IF EXISTS assignments;
    DROP TABLE IF EXISTS subjects;
    DROP TABLE IF EXISTS enrollments;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS teachers;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS roles;
    DROP TABLE IF EXISTS audit_logs;

    CREATE TABLE roles (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE users (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role_id INT NOT NULL,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY email (email),
      KEY role_id (role_id),
      CONSTRAINT users_ibfk_1 FOREIGN KEY (role_id) REFERENCES roles(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE teachers (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT teachers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE students (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      admission_no VARCHAR(50),
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT students_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE courses (
      id INT NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id INT DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY teacher_id (teacher_id),
      CONSTRAINT courses_ibfk_1 FOREIGN KEY (teacher_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE enrollments (
      id INT NOT NULL AUTO_INCREMENT,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      enrolled_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('active','inactive') DEFAULT 'active',
      PRIMARY KEY (id),
      KEY student_id (student_id),
      KEY course_id (course_id),
      CONSTRAINT enrollments_ibfk_1 FOREIGN KEY (student_id) REFERENCES users(id),
      CONSTRAINT enrollments_ibfk_2 FOREIGN KEY (course_id) REFERENCES courses(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE assignments (
      id INT NOT NULL AUTO_INCREMENT,
      course_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATETIME DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      teacher_id INT NOT NULL,
      PRIMARY KEY (id),
      KEY course_id (course_id),
      KEY teacher_id (teacher_id),
      CONSTRAINT assignments_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses(id),
      CONSTRAINT assignments_ibfk_2 FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE subjects (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      course_id INT NOT NULL,
      teacher_id INT NOT NULL,
      PRIMARY KEY (id),
      KEY course_id (course_id),
      KEY teacher_id (teacher_id),
      CONSTRAINT subjects_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses(id),
      CONSTRAINT subjects_ibfk_2 FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE submissions (
      id INT NOT NULL AUTO_INCREMENT,
      assignment_id INT NOT NULL,
      student_id INT NOT NULL,
      file_path VARCHAR(255),
      submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      grade VARCHAR(10),
      feedback TEXT,
      PRIMARY KEY (id),
      KEY assignment_id (assignment_id),
      KEY student_id (student_id),
      CONSTRAINT submissions_ibfk_1 FOREIGN KEY (assignment_id) REFERENCES assignments(id),
      CONSTRAINT submissions_ibfk_2 FOREIGN KEY (student_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE payments (
      id INT NOT NULL AUTO_INCREMENT,
      student_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending','completed','failed') DEFAULT 'pending',
      PRIMARY KEY (id),
      KEY student_id (student_id),
      CONSTRAINT payments_ibfk_1 FOREIGN KEY (student_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE audit_logs (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT DEFAULT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      ip VARCHAR(45),
      user_agent VARCHAR(255),
      meta JSON,
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT audit_logs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    SET FOREIGN_KEY_CHECKS = 1;
  `;
  await connection.query(sql);
  console.log('Tables recreated successfully.');
}

async function seedData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    await recreateTables(connection);

    // Roles
    await connection.query("INSERT INTO roles (name) VALUES ('Admin'), ('Teacher'), ('Student')");
    console.log('Roles inserted');

    // Users
    const usersData = [];
    for (let i = 0; i < 5; i++) usersData.push([faker.person.fullName(), faker.internet.email(), 'password', 2]);
    for (let i = 0; i < 10; i++) usersData.push([faker.person.fullName(), faker.internet.email(), 'password', 3]);

    await connection.query('INSERT INTO users (name,email,password,role_id) VALUES ?', [usersData]);
    console.log('Users inserted');

    // Teachers
    await connection.query('INSERT INTO teachers (user_id) SELECT id FROM users WHERE role_id = 2');
    console.log('Teachers inserted');

    // Students
    await connection.query('INSERT INTO students (user_id, admission_no) SELECT id, CONCAT("ADM", LPAD(id,4,"0")) FROM users WHERE role_id = 3');
    console.log('Students inserted');

    // Courses
    const [teachers] = await connection.query('SELECT id FROM teachers');
    const coursesData = teachers.map(t => [faker.company.name(), faker.lorem.paragraph(), t.id]);
    await connection.query('INSERT INTO courses (title, description, teacher_id) VALUES ?', [coursesData]);
    console.log('Courses inserted');

    // Assignments
    const [courses] = await connection.query('SELECT id, teacher_id FROM courses');
    const assignmentsData = courses.map(c => [c.id, faker.lorem.sentence(), faker.lorem.paragraph(), faker.date.soon(), c.teacher_id]);
    await connection.query('INSERT INTO assignments (course_id, title, description, due_date, teacher_id) VALUES ?', [assignmentsData]);
    console.log('Assignments inserted');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedData();
