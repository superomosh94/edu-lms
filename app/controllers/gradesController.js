exports.listGrades = (req, res) => {
    res.render('grades/list', {
        title: "Grades",
        user: req.user || null,
        grades: [
            { course: "Mathematics", grade: "A" },
            { course: "Physics", grade: "B+" },
            { course: "Chemistry", grade: "A-" }
        ]
    });
};
