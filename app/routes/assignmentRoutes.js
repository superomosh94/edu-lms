const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', assignmentController.getAllAssignments);

// View single assignment (public)
router.get('/view/:id', assignmentController.viewAssignment);

// Protected routes
router.use(authMiddleware.authenticate);

// Teacher/Admin routes
router.get('/create',
  roleMiddleware.restrictTo('teacher', 'admin'),
  assignmentController.showCreateForm
);

router.post('/create',
  roleMiddleware.restrictTo('teacher', 'admin'),
  validationMiddleware.validateAssignment,
  assignmentController.createAssignment
);

router.get('/:id/edit',
  roleMiddleware.restrictTo('teacher', 'admin'),
  assignmentController.showEditForm
);

router.post('/:id/edit',
  roleMiddleware.restrictTo('teacher', 'admin'),
  validationMiddleware.validateAssignment,
  assignmentController.updateAssignment
);

router.post('/:id/delete',
  roleMiddleware.restrictTo('teacher', 'admin'),
  assignmentController.deleteAssignment
);

// Generic fallback: get assignment details by ID
router.get('/:id', assignmentController.getAssignment);

module.exports = router;
