const db = require('../controllers/config/db'); // MySQL connection

const Student = {
    getById: (studentId, callback) => {
        const query = `
            SELECT id, name, email, registration_number 
            FROM students 
            WHERE id = ?
        `;
        db.query(query, [studentId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    getAll: (callback) => {
        const query = `
            SELECT id, name, email, registration_number 
            FROM students
        `;
        db.query(query, (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    }
};

module.exports = Student;
