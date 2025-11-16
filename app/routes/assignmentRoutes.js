const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// Mock middlewares (replace with real ones when available)
const authMiddleware = {
  authenticate: (req, res, next) => {
    // Mock authentication - replace with real implementation
    console.log('[Mock Auth] Authenticating user...');
    
    // Set mock user data for testing
    req.user = {
      id: 1,
      role: 'student', // Change to 'teacher' or 'admin' to test different roles
      name: 'Test User',
      email: 'test@example.com'
    };
    
    console.log(`[Mock Auth] User authenticated: ${req.user.name} (${req.user.role})`);
    next();
  }
};

const roleMiddleware = {
  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        console.log('[Mock Role] No user found - authentication required');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!roles.includes(req.user.role)) {
        console.log(`[Mock Role] Access denied. User role: ${req.user.role}, Required: ${roles.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      console.log(`[Mock Role] Access granted for ${req.user.role}`);
      next();
    };
  }
};

const validationMiddleware = {
  validateAssignment: (req, res, next) => {
    console.log('[Mock Validation] Validating assignment data...');
    // Basic validation - replace with real validation
    const { title, description, dueDate } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignment title is required'
      });
    }
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignment description is required'
      });
    }
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required'
      });
    }
    
    console.log('[Mock Validation] Assignment data validated successfully');
    next();
  },
  
  validateSubmission: (req, res, next) => {
    console.log('[Mock Validation] Validating submission data...');
    // Basic validation - replace with real validation
    const { submissionText } = req.body;
    const hasFile = req.files && req.files.submissionFile;
    
    if (!submissionText && !hasFile) {
      return res.status(400).json({
        success: false,
        message: 'Either text submission or file upload is required'
      });
    }
    
    console.log('[Mock Validation] Submission data validated successfully');
    next();
  }
};

// Public routes
router.get('/', assignmentController.getAllAssignments);

// View single assignment (public)
router.get('/view/:id', assignmentController.viewAssignment);

// Protected routes
router.use(authMiddleware.authenticate);

// Student assignment submission routes
router.get('/:id/submit',
  roleMiddleware.restrictTo('student'),
  assignmentController.showSubmitForm
);

router.post('/:id/submit',
  roleMiddleware.restrictTo('student'),
  validationMiddleware.validateSubmission,
  assignmentController.submitAssignment
);

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