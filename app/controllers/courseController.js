const Course = require('../models/Course');
const auditHelper = require('../helpers/auditHelper');
const validationHelper = require('../helpers/validationHelper');

const courseController = {

  getAllCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const courses = await Course.findAll({ page: parseInt(page), limit: parseInt(limit), status, category });
      const total = await Course.getCount({ status, category });

      res.render('courses/list', {
        title: 'Courses',
        courses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total },
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Get all courses error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load courses.' });
    }
  },

  getCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      if (req.user && ['Teacher', 'Admin'].includes(req.user.role)) {
        course.enrolledStudents = await Course.getEnrolledStudents(courseId);
      }

      res.render('courses/view', {
        title: course.title || "Course",
        course,
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load course.' });
    }
  },

  showCreateForm: (req, res) => {
    res.render('courses/create', {
      title: 'Create Course',
      activePage: 'courses',
      user: req.user || null,
      errors: []
    });
  },

  createCourse: async (req, res) => {
    try {
      const validation = validationHelper.validateCourseCreation(req.body);
      if (!validation.isValid) {
        return res.render('courses/create', {
          title: 'Create Course',
          errors: validation.errors || [],
          activePage: 'courses',
          user: req.user || null
        });
      }

      const courseData = {
        ...req.body,
        teacherId: req.user && req.user.role === 'Admin' ? req.body.teacherId : (req.user ? req.user.id : null),
        status: 'active',
        image: req.file ? `/uploads/${req.file.filename}` : '/public/images/placeholder/course-300x200.svg'
      };

      const course = await Course.create(courseData);
      await auditHelper.logAction(req.user.id, 'COURSE_CREATE', `Created course: ${course.title}`, course.id);

      res.redirect('/courses');
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to create course.' });
    }
  },

  showEditForm: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      res.render('courses/edit', {
        title: `Edit Course - ${course.title}`,
        course,
        activePage: 'courses',
        user: req.user || null,
        errors: []
      });
    } catch (error) {
      console.error('Show edit form error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load course for editing.' });
    }
  },

  updateCourse: async (req, res) => {
    try {
      const courseId = req.params.id;

      if (!courseId) {
        return res.status(400).render('error', { title: 'Error', message: 'Course ID is missing' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      const validation = validationHelper.validateCourseUpdate(req.body); // FIXED
      if (!validation.isValid) {
        return res.render('courses/edit', {
          title: `Edit Course - ${course.title}`,
          course,
          errors: validation.errors || [],
          activePage: 'courses',
          user: req.user || null
        });
      }

      const updatedCourse = await Course.update(courseId, req.body);
      if (!updatedCourse) {
        return res.status(500).render('error', { title: 'Error', message: 'Failed to update course' });
      }

      await auditHelper.logAction(req.user.id, 'COURSE_UPDATE', `Updated course: ${course.title}`, courseId);
      res.redirect(`/courses/view/${courseId}`);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to update course.' });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).render('error', { title: 'Forbidden', message: 'Only admins can delete courses.' });
      }

      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      const deleted = await Course.delete(courseId);
      if (!deleted) {
        return res.status(500).render('error', { title: 'Error', message: 'Failed to delete course.' });
      }

      await auditHelper.logAction(req.user.id, 'COURSE_DELETE', `Deleted course: ${course.title}`, courseId);
      res.redirect('/courses');
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to delete course.' });
    }
  },

  enrollInCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      await Course.enroll(req.user.id, courseId);
      await auditHelper.logAction(req.user.id, 'COURSE_ENROLL', `Enrolled in course: ${course.title}`, courseId);

      res.redirect(`/courses/view/${courseId}`);
    } catch (error) {
      console.error('Enroll course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to enroll in course.' });
    }
  },

  getMyCourses: async (req, res) => {
    try {
      const courses = await Course.getStudentCourses(req.user.id);

      res.render('courses/list', {
        title: 'My Courses',
        courses,
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Get my courses error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load your courses.' });
    }
  },

  getTeacherCourses: async (req, res) => {
    try {
      const courses = await Course.getTeacherCourses(req.user.id);

      res.render('courses/list', {
        title: 'My Courses',
        courses,
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Get teacher courses error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load your courses.' });
    }
  }
};

module.exports = courseController;
