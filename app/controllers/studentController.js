// app/controllers/studentController.js

const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require('../models/Student');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const auditHelper = require('../helpers/auditHelper');

const studentController = {
    getMyCourses: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const courses = await Course.findByStudent(studentId);
            const coursesWithProgress = await Promise.all(
                courses.map(async (course) => {
                    const totalAssignments = await Assignment.getCountByCourse(course.id);
                    const completedAssignments = await Assignment.getCompletedCountByStudent(course.id, studentId);
                    const averageGrade = await Assignment.getAverageGradeByCourseAndStudent(course.id, studentId);

                    return { ...course, progress: { totalAssignments, completedAssignments, averageGrade } };
                })
            );

            res.render('student/courses', {
                title: "My Courses",
                courses: coursesWithProgress
            });
        } catch (error) {
            console.error('Get student courses error:', error);
            res.status(500).render('error', {
                title: "Error",
                message: "Unable to fetch courses",
                error
            });
        }
    },

    getEnrollPage: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const availableCourses = await Course.findAvailable();

            // Mark courses with enrollment status
            const coursesWithStatus = await Promise.all(
                availableCourses.map(async (course) => {
                    const isEnrolled = await Enrollment.isEnrolled(studentId, course.id);
                    return { ...course, isEnrolled };
                })
            );

            res.render('student/enroll', {
                title: "Enroll in a Course",
                availableCourses: coursesWithStatus,
                user: req.user,
                activePage: "enroll"
            });
        } catch (error) {
            console.error('Get enroll page error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load enroll page", error });
        }
    },

    postEnroll: async (req, res) => {
        try {
            const studentId = req.userId;
            const { courseId } = req.body;

            if (!studentId || !courseId) throw new Error('Missing enrollment data');

            const alreadyEnrolled = await Enrollment.isEnrolled(studentId, courseId);
            if (alreadyEnrolled) {
                return res.status(400).render('error', {
                    title: "Enrollment Error",
                    message: "You are already enrolled in this course"
                });
            }

            await Enrollment.create({ studentId, courseId });
            await auditHelper.logAction(studentId, 'ENROLL_COURSE', `Enrolled in course ID ${courseId}`);

            res.redirect('/student/courses');
        } catch (error) {
            console.error('Post enroll error:', error);
            res.status(500).render('error', { title: "Error", message: "Enrollment failed", error });
        }
    },

    getCourse: async (req, res) => {
        try {
            const courseId = req.params.courseId;
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const isEnrolled = await Course.isStudentEnrolled(courseId, studentId);
            if (!isEnrolled) return res.status(403).render('error', { title: "Access Denied", message: "Not enrolled in this course" });

            const course = await Course.findById(courseId);
            const assignments = await Assignment.findByCourse(courseId);

            const assignmentsWithStatus = await Promise.all(
                assignments.map(async (assignment) => {
                    const submission = await Assignment.getStudentSubmission(assignment.id, studentId);
                    return {
                        ...assignment,
                        submissionStatus: submission ? 'submitted' : 'pending',
                        grade: submission?.grade || null,
                        submittedAt: submission?.submittedAt || null
                    };
                })
            );

            res.render('student/course', {
                title: course.title,
                course,
                assignments: assignmentsWithStatus
            });
        } catch (error) {
            console.error('Get student course error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load course", error });
        }
    },

    getAssignments: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const assignments = await Assignment.getByStudent(studentId);
            res.render('student/assignments', { title: "Assignments", assignments });
        } catch (error) {
            console.error('Get assignments error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load assignments", error });
        }
    },

    getAssignmentDetail: async (req, res) => {
        try {
            const assignmentId = req.params.id;
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) return res.status(404).render('error', { title: "Not Found", message: "Assignment not found" });

            const submission = await Assignment.getStudentSubmission(assignmentId, studentId);
            res.render('student/assignment-detail', { title: assignment.title, assignment, submission });
        } catch (error) {
            console.error('Get assignment detail error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load assignment details", error });
        }
    },

    getMySubmissions: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const submissions = await Assignment.getStudentSubmissions(studentId);
            res.render('student/submissions', { title: "My Submissions", submissions });
        } catch (error) {
            console.error('Get student submissions error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load submissions", error });
        }
    },

    getSubmission: async (req, res) => {
        try {
            const submissionId = req.params.id;
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const submission = await Assignment.getSubmissionById(submissionId);
            if (!submission) return res.status(404).render('error', { title: "Not Found", message: "Submission not found" });
            if (submission.studentId !== studentId) return res.status(403).render('error', { title: "Access Denied", message: "You cannot view this submission" });

            submission.assignment = await Assignment.findById(submission.assignmentId);
            res.render('student/submission-detail', { title: "Submission Detail", submission });
        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load submission", error });
        }
    },

    getMyGrades: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const grades = await Assignment.getGradesByStudent(studentId);
            const overallStats = {
                averageGrade: await Assignment.getAverageGradeByStudent(studentId),
                totalAssignments: await Assignment.getTotalAssignmentsCount(studentId),
                completedAssignments: await Assignment.getCompletedCount(studentId),
                pendingAssignments: await Assignment.getPendingCount(studentId)
            };

            res.render('student/grades', { title: 'Grades | Student Panel', grades, overallStats });
        } catch (error) {
            console.error('Get student grades error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load grades", error });
        }
    },

    getCourseRecommendations: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const enrolledCourses = await Course.findByStudent(studentId);
            let recommendations;

            if (!enrolledCourses.length) {
                recommendations = await Course.findPopular(5);
            } else {
                const enrolledCategories = [...new Set(enrolledCourses.map(course => course.category))];
                recommendations = await Course.findByCategories(enrolledCategories, 5, studentId);
            }

            res.render('student/recommendations', { title: "Course Recommendations", recommendations });
        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load recommendations", error });
        }
    },

    getNotifications: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const notifications = await Notification.getForStudent(studentId);
            res.render('student/notifications', { title: "Notifications", notifications });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).render('error', { title: "Error", message: "Unable to load notifications", error });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const studentId = req.userId;
            if (!studentId) throw new Error('Student ID is missing');

            const { bio, interests, contactInfo } = req.body;
            const updatedStudent = await User.updateStudentProfile(studentId, { bio, interests, contactInfo });
            await auditHelper.logAction(studentId, 'STUDENT_UPDATE_PROFILE', 'Updated student profile');

            res.json({ message: 'Profile updated successfully', student: updatedStudent });
        } catch (error) {
            console.error('Update student profile error:', error);
            res.status(500).json({ message: 'Failed to update profile', error });
        }
    }
};

module.exports = studentController;
