const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const methodOverride = require('method-override');

const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationHelper = require('../helpers/validationHelper');

// Enable method override for PUT/DELETE
router.use(methodOverride('_method'));

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Validation middleware
const validationMiddleware = {
  validateCourseCreation: (req, res, next) => {
    const validation = validationHelper.validateCourseCreation(req.body);
    if (!validation.isValid) {
      return res.render('courses/create', {
        title: 'Create Course',
        errors: validation.errors || [],
        activePage: 'courses',
        user: req.user || null
      });
    }
    next();
  },
  validateCourseUpdate: (req, res, next) => {
    const validation = validationHelper.validateCourseUpdate(req.body);
    if (!validation.isValid) {
      return res.render('courses/edit', {
        title: 'Edit Course',
        errors: validation.errors || [],
        activePage: 'courses',
        user: req.user || null
      });
    }
    next();
  }
};

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/view/:id', courseController.getCourse);

// Authenticate all routes below
router.use(authMiddleware.authenticate);

// Teacher/Admin routes
router.get('/create', roleMiddleware.restrictTo('Teacher', 'Admin'), courseController.showCreateForm);
router.post('/create', roleMiddleware.restrictTo('Teacher', 'Admin'), upload.single('image'), validationMiddleware.validateCourseCreation, courseController.createCourse);

router.get('/:id/edit', roleMiddleware.restrictTo('Teacher', 'Admin'), courseController.showEditForm);
router.put('/:id', roleMiddleware.restrictTo('Teacher', 'Admin'), upload.single('image'), validationMiddleware.validateCourseUpdate, courseController.updateCourse);

// Student routes
router.post('/:id/enroll', roleMiddleware.restrictTo('Student'), courseController.enrollInCourse);
router.get('/student/my-courses', roleMiddleware.restrictTo('Student'), courseController.getMyCourses);

// Teacher routes
router.get('/teacher/my-courses', roleMiddleware.restrictTo('Teacher', 'Admin'), courseController.getTeacherCourses);

// Admin delete route
router.post('/:id/delete', roleMiddleware.restrictTo('Admin'), courseController.deleteCourse);

// This must be last
router.get('/:id', courseController.getCourse);

module.exports = router;
