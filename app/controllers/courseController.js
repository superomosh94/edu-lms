const Course = require('../models/Course');
const auditHelper = require('../helpers/auditHelper');
const validationHelper = require('../helpers/validationHelper');

const courseController = {

  // List all courses page
  getAllCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const courses = await Course.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        category
      });

      const total = await Course.getCount({ status, category });

      res.render('courses/list', {
        title: 'Courses',
        courses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load courses.' });
    }
  },

  // Show single course page
  getCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });

      if (req.userRole === 'teacher' || req.userRole === 'admin') {
        course.enrolledStudents = await Course.getEnrolledStudents(req.params.id);
      }

      res.render('courses/view', { title: course.title, course });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load course.' });
    }
  },

  // Placeholder: show course creation form
  showCreateForm: (req, res) => {
    res.send('Create course form placeholder');
  },

  // Handle course creation
  createCourse: async (req, res) => {
    try {
      const validation = validationHelper.validateCourseCreation(req.body);
      if (!validation.isValid) return res.send('Validation failed placeholder');

      const courseData = {
        ...req.body,
        teacherId: req.userRole === 'admin' ? req.body.teacherId : req.userId,
        status: 'active'
      };

      const course = await Course.create(courseData);
      await auditHelper.logAction(req.userId, 'COURSE_CREATE', `Created course: ${course.title}`, course.id);

      res.redirect('/courses');
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).send('Unable to create course placeholder');
    }
  },

  // Placeholder: show edit form
  showEditForm: (req, res) => {
    res.send(`Edit course form placeholder for ID ${req.params.id}`);
  },

  // Handle course update
  updateCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.send('Course not found placeholder');

      await Course.update(req.params.id, req.body);
      await auditHelper.logAction(req.userId, 'COURSE_UPDATE', `Updated course: ${course.title}`, req.params.id);

      res.redirect('/courses');
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).send('Unable to update course placeholder');
    }
  },

  // Handle course deletion
  deleteCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.send('Course not found placeholder');

      await Course.delete(req.params.id);
      await auditHelper.logAction(req.userId, 'COURSE_DELETE', `Deleted course: ${course.title}`, req.params.id);

      res.redirect('/courses');
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).send('Unable to delete course placeholder');
    }
  },

  // Placeholder for enrollment
  enrollInCourse: (req, res) => {
    res.send(`Enroll in course placeholder for course ID ${req.params.id}`);
  },

  // Placeholder for student's courses
  getMyCourses: (req, res) => {
    res.send(`My courses placeholder for student ID ${req.userId}`);
  },

  // Placeholder for teacher's courses
  getTeacherCourses: (req, res) => {
    res.send(`Teacher courses placeholder for teacher ID ${req.userId}`);
  }
};

module.exports = courseController;
