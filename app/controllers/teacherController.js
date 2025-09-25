const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const auditHelper = require('../helpers/auditHelper');

const teacherController = {
    // Get teacher's courses with statistics
    getMyCourses: async (req, res) => {
        try {
            const teacherId = req.userId;
            const courses = await Course.findByTeacher(teacherId);

            // Add statistics for each course
            const coursesWithStats = await Promise.all(
                courses.map(async (course) => {
                    const stats = {
                        totalStudents: await Course.getEnrollmentCount(course.id),
                        totalAssignments: await Assignment.getCountByCourse(course.id),
                        averageGrade: await Assignment.getAverageGradeByCourse(course.id)
                    };
                    return { ...course, stats };
                })
            );

            res.json({ courses: coursesWithStats });
        } catch (error) {
            console.error('Get teacher courses error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get students enrolled in teacher's courses
    getMyStudents: async (req, res) => {
        try {
            const teacherId = req.userId;
            const students = await User.findStudentsByTeacher(teacherId);

            res.json({ students });
        } catch (error) {
            console.error('Get teacher students error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get submissions for teacher's assignments
    getSubmissions: async (req, res) => {
        try {
            const teacherId = req.userId;
            const { status, courseId, assignmentId } = req.query;

            const submissions = await Assignment.getSubmissionsByTeacher(teacherId, {
                status,
                courseId,
                assignmentId
            });

            res.json({ submissions });
        } catch (error) {
            console.error('Get submissions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get submission details
    getSubmission: async (req, res) => {
        try {
            const submissionId = req.params.id;
            const submission = await Assignment.getSubmissionById(submissionId);

            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            // Verify teacher owns the assignment
            const assignment = await Assignment.findById(submission.assignmentId);
            if (assignment.teacherId !== req.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get student details
            submission.student = await User.findById(submission.studentId);

            res.json({ submission });
        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Grade submission
    gradeSubmission: async (req, res) => {
        try {
            const submissionId = req.params.id;
            const { points, feedback } = req.body;

            const submission = await Assignment.getSubmissionById(submissionId);
            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            // Verify teacher owns the assignment
            const assignment = await Assignment.findById(submission.assignmentId);
            if (assignment.teacherId !== req.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Validate points
            if (points > assignment.maxPoints) {
                return res.status(400).json({ 
                    error: `Points cannot exceed maximum points (${assignment.maxPoints})` 
                });
            }

            await Assignment.gradeSubmission(submissionId, points, feedback, req.userId);

            // Log audit trail
            await auditHelper.logAction(req.userId, 'TEACHER_GRADE_SUBMISSION', 
                `Graded submission ${submissionId}`, submissionId);

            res.json({ message: 'Submission graded successfully' });
        } catch (error) {
            console.error('Grade submission error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get course analytics
    getCourseAnalytics: async (req, res) => {
        try {
            const courseId = req.params.courseId;
            
            // Verify teacher owns the course
            const course = await Course.findById(courseId);
            if (!course || course.teacherId !== req.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const analytics = {
                enrollmentStats: await Course.getEnrollmentStats(courseId),
                assignmentStats: await Assignment.getStatsByCourse(courseId),
                gradeDistribution: await Assignment.getGradeDistribution(courseId),
                studentPerformance: await Assignment.getStudentPerformance(courseId)
            };

            res.json({ analytics });
        } catch (error) {
            console.error('Get course analytics error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Send announcement to course students
    sendAnnouncement: async (req, res) => {
        try {
            const courseId = req.params.courseId;
            const { title, message } = req.body;

            // Verify teacher owns the course
            const course = await Course.findById(courseId);
            if (!course || course.teacherId !== req.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get enrolled students
            const students = await Course.getEnrolledStudents(courseId);

            // Here you would typically send notifications/emails
            // This is a simplified implementation
            const announcement = {
                courseId,
                teacherId: req.userId,
                title,
                message,
                sentAt: new Date(),
                recipients: students.length
            };

            // Log audit trail
            await auditHelper.logAction(req.userId, 'TEACHER_SEND_ANNOUNCEMENT', 
                `Sent announcement to ${students.length} students in course: ${course.title}`,
                courseId);

            res.json({ 
                message: `Announcement sent to ${students.length} students`,
                announcement 
            });
        } catch (error) {
            console.error('Send announcement error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = teacherController;