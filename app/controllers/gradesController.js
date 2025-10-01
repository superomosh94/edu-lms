exports.listGrades = async (req, res) => {
    try {
        const userId = req.user.id; // logged-in user

        const [grades] = await pool.query(`
            SELECT c.title AS course, g.grade
            FROM grades g
            JOIN courses c ON g.course_id = c.id
            WHERE g.student_id = ?
        `, [userId]);

        res.render('grades/list', {
            title: "Grades",
            user: req.user || null,
            grades
        });
    } catch (error) {
        console.error("Error loading grades:", error);
        res.status(500).send("Error loading grades");
    }
};
