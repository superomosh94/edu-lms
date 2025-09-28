const db = require('../controllers/config/db'); // MySQL connection

const Grade = {
    getByStudentId: (studentId, callback) => {
        const query = `
            SELECT course, grade 
            FROM grades 
            WHERE student_id = ?
        `;
        db.query(query, [studentId], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    },

    create: (studentId, course, grade, callback) => {
        const query = `
            INSERT INTO grades (student_id, course, grade) 
            VALUES (?, ?, ?)
        `;
        db.query(query, [studentId, course, grade], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    }
};

module.exports = Grade;
