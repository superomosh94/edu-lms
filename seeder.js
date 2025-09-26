// seeder.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'edulms',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Get role ids
    const [roles] = await connection.execute('SELECT id, name FROM roles');
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.name.toLowerCase()] = r.id;
    });

    // Define users with plain role names
    const users = [
      { name: 'Super Admin', email: 'admin@example.com', password: 'password123', role: 'Admin' },
      { name: 'John Teacher', email: 'teacher@example.com', password: 'password123', role: 'Teacher' },
      { name: 'Jane Student', email: 'student@example.com', password: 'password123', role: 'Student' },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await connection.execute(
        `INSERT IGNORE INTO users (name, email, password, role_id, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [user.name, user.email, hashedPassword, roleMap[user.role.toLowerCase()]]
      );
    }

    console.log('✅ Users seeded successfully');
  } catch (err) {
    console.error('❌ Error inserting seed data:', err);
  } finally {
    await connection.end();
  }
}

seedUsers();
