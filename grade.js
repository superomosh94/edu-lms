// const db = require('./app/controllers/config/db'); // Adjust path if needed

// async function createTableAndInsertData() {
//     try {
//         // 1. Create grades table
//         await db.query(`
//             CREATE TABLE IF NOT EXISTS grades (
//                 id INT AUTO_INCREMENT PRIMARY KEY,
//                 student_id INT NOT NULL,
//                 course VARCHAR(255) NOT NULL,
//                 grade VARCHAR(10) NOT NULL,
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//                 FOREIGN KEY (student_id) REFERENCES students(id)
//             )
//         `);

//         console.log('✅ grades table created or already exists.');

//         // 2. Insert sample data
//         const sampleData = [
//             { student_id: 1, course: 'Mathematics', grade: 'A' },
//             { student_id: 1, course: 'Physics', grade: 'B+' },
//             { student_id: 2, course: 'Chemistry', grade: 'A-' },
//             { student_id: 2, course: 'Biology', grade: 'B' }
//         ];

//         for (const data of sampleData) {
//             await db.query(
//                 'INSERT INTO grades (student_id, course, grade) VALUES (?, ?, ?)',
//                 [data.student_id, data.course, data.grade]
//             );
//         }

//         console.log('✅ Sample grades inserted.');
//         process.exit(0);
//     } catch (err) {
//         console.error('❌ Error:', err);
//         process.exit(1);
//     }
// }

// createTableAndInsertData();



const db = require('./app/controllers/config/db');

async function createStudentsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ students table created');

        await db.query(`
            INSERT INTO students (name, email) VALUES
            ('John Doe', 'john@example.com'),
            ('Jane Smith', 'jane@example.com')
        `);

        console.log('✅ Sample students inserted');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating students table:', err);
        process.exit(1);
    }
}

createStudentsTable();
