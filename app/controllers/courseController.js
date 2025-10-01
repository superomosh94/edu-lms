const Course = require('../models/Course');
const auditHelper = require('../helpers/auditHelper');
const validationHelper = require('../helpers/validationHelper');

const courseController = {

  // List all courses
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
        pagination: { page: parseInt(page), limit: parseInt(limit), total },
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load courses.' });
    }
  },

  // View single course
  getCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        course.enrolledStudents = await Course.getEnrolledStudents(req.params.id);
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

  // Show course creation form
  showCreateForm: (req, res) => {
    res.render('courses/create', {
      title: 'Create Course',
      activePage: 'courses',
      user: req.user || null
    });
  },

  // Handle course creation
  createCourse: async (req, res) => {
    try {
      const validation = validationHelper.validateCourseCreation(req.body);
      if (!validation.isValid) {
        return res.render('courses/create', {
          title: 'Create Course',
          errors: validation.errors,
          activePage: 'courses',
          user: req.user || null
        });
      }

      const courseData = {
        ...req.body,
        teacherId: req.user.role === 'admin' ? req.body.teacherId : req.user.id,
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

  // Show course edit form
  showEditForm: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      res.render('courses/edit', {
        title: `Edit Course - ${course.title}`,
        course,
        activePage: 'courses',
        user: req.user || null
      });
    } catch (error) {
      console.error('Show edit form error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load course for editing.' });
    }
  },

  // Handle course update
  updateCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      await Course.update(req.params.id, req.body);
      await auditHelper.logAction(req.user.id, 'COURSE_UPDATE', `Updated course: ${course.title}`, req.params.id);

      res.redirect(`/courses/view/${req.params.id}`);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to update course.' });
    }
  },

  // Handle course deletion — Admin only
  deleteCourse: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).render('error', { title: 'Forbidden', message: 'Only admins can delete courses.' });
      }

      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      await Course.delete(req.params.id);
      await auditHelper.logAction(req.user.id, 'COURSE_DELETE', `Deleted course: ${course.title}`, req.params.id);

      res.redirect('/courses');
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to delete course.' });
    }
  },

  // Enroll in a course
  enrollInCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Course not found' });
      }

      await Course.enroll(req.user.id, req.params.id);
      await auditHelper.logAction(req.user.id, 'COURSE_ENROLL', `Enrolled in course: ${course.title}`, course.id);

      res.redirect(`/courses/view/${req.params.id}`);
    } catch (error) {
      console.error('Enroll course error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to enroll in course.' });
    }
  },

  // Get courses for current student
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

  // Get courses for current teacher
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
