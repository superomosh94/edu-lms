module.exports = {
  validateAssignment: (req, res, next) => next(),

  validateUserCreate: (req, res, next) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).send('Missing fields');
    }
    next();
  },

  validateUserUpdate: (req, res, next) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).send('Missing fields');
    }
    next();
  },

  validateCourseCreate: (req, res, next) => {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).send('Missing fields');
    }
    next();
  },

  validateCourseModeration: (req, res, next) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).send('Missing status');
    }
    next();
  },

  // ADD THIS MISSING METHOD:
  validateStudentProfileUpdate: (req, res, next) => {
    const { firstName, lastName, email } = req.body;
    
    // Basic validation - you can expand this as needed
    if (!firstName && !lastName && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (firstName, lastName, or email) is required'
      });
    }
    
    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }
    
    next();
  }
};