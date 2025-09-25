const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const auditHelper = require('../helpers/auditHelper');

const studentController = {
    // Get student's enrolled courses
    getMyCourses: async (req, res) => {
        try {
            const studentId = req.userId;
            const courses = await Course.findByStudent(studentId);

            // Add progress information for each course
            const coursesWithProgress = await Promise.all(
                courses.map(async (course) => {
                    const progress = {
                        totalAssignments: await Assignment.getCountByCourse(course.id),
                        completedAssignments: await Assignment.getCompletedCountByStudent(course.id, studentId),
                        averageGrade: await Assignment.getAverageGradeByCourseAndStudent(course.id, studentId)
                    };
                    return { ...course, progress };
                })
            );

            res.json({ courses: coursesWithProgress });
        } catch (error) {
            console.error('Get student courses error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get course details with student-specific information
    getCourse: async (req, res) => {
        try {
            const courseId = req.params.courseId;
            const studentId = req.userId;

            // Verify enrollment
            const isEnrolled = await Course.isStudentEnrolled(courseId, studentId);
            if (!isEnrolled) {
                return res.status(403).json({ error: 'Not enrolled in this course' });
            }

            const course = await Course.findById(courseId);
            const assignments = await Assignment.findByCourse(courseId);
            
            // Add submission status for each assignment
            const assignmentsWithStatus = await Promise.all(
                assignments.map(async (assignment) => {
                    const submission = await Assignment.getStudentSubmission(assignment.id, studentId);
                    return {
                        ...assignment,
                        submissionStatus: submission ? 'submitted' : 'pending',
                        grade: submission ? submission.grade : null,
                        submittedAt: submission ? submission.submittedAt : null
                    };
                })
            );

            res.json({ 
                course, 
                assignments: assignmentsWithStatus 
            });
        } catch (error) {
            console.error('Get student course error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get student's submissions
    getMySubmissions: async (req, res) => {
        try {
            const studentId = req.userId;
            const submissions = await Assignment.getStudentSubmissions(studentId);

            res.json({ submissions });
        } catch (error) {
            console.error('Get student submissions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get submission details
    getSubmission: async (req, res) => {
        try {
            const submissionId = req.params.id;
            const studentId = req.userId;

            const submission = await Assignment.getSubmissionById(submissionId);
            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            // Verify ownership
            if (submission.studentId !== studentId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get assignment details
            submission.assignment = await Assignment.findById(submission.assignmentId);

            res.json({ submission });
        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get student's grades and performance
    getMyGrades: async (req, res) => {
        try {
            const studentId = req.userId;

            const grades = await Assignment.getGradesByStudent(studentId);
            const overallStats = {
                averageGrade: await Assignment.getAverageGrade(studentId),
                totalAssignments: await Assignment.getTotalAssignmentsCount(studentId),
                completedAssignments: await Assignment.getCompletedCount(studentId),
                pendingAssignments: await Assignment.getPendingCount(studentId)
            };

            res.json({ 
                grades, 
                overallStats 
            });
        } catch (error) {
            console.error('Get student grades error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get course recommendations based on enrolled courses
    getCourseRecommendations: async (req, res) => {
        try {
            const studentId = req.userId;
            
            // Get student's enrolled courses
            const enrolledCourses = await Course.findByStudent(studentId);
            
            if (enrolledCourses.length === 0) {
                // If no enrolled courses, return popular courses
                const popularCourses = await Course.findPopular(5);
                return res.json({ recommendations: popularCourses });
            }

            // Simple recommendation based on categories of enrolled courses
            const enrolledCategories = [...new Set(enrolledCourses.map(course => course.category))];
            const recommendedCourses = await Course.findByCategories(enrolledCategories, 5, studentId);

            res.json({ recommendations: recommendedCourses });
        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update student profile
    updateProfile: async (req, res) => {
        try {
            const studentId = req.userId;
            const { bio, interests, contactInfo } = req.body;

            const updatedStudent = await User.updateStudentProfile(studentId, {
                bio,
                interests,
                contactInfo
            });

            // Log audit trail
            await auditHelper.logAction(studentId, 'STUDENT_UPDATE_PROFILE', 
                'Updated student profile');

            res.json({ 
                message: 'Profile updated successfully',
                student: updatedStudent 
            });
        } catch (error) {
            console.error('Update student profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = studentController;