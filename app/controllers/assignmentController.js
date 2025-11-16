const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');

// Mock helpers (replace with real ones if available)
const auditHelper = {
  logAction: async (userId, action, description, resourceId) => {
    console.log(`[Audit] ${action}: ${description} by user ${userId}`);
    return true;
  }
};

const validationHelper = {
  validateAssignment: (data) => {
    // Simple validation - replace with real validation
    const errors = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }
    if (!data.dueDate) {
      errors.push('Due date is required');
    }
    return { 
      isValid: errors.length === 0, 
      errors 
    };
  },
  validateSubmission: (data) => {
    // Simple validation - replace with real validation
    const errors = [];
    if (!data.submissionText && !data.submissionFile) {
      errors.push('Either text submission or file upload is required');
    }
    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }
};

const assignmentController = {

  // List all assignments for teacher/admin
  getAllAssignments: async (req, res) => {
    try {
      const assignments = await Assignment.findAll();
      const courses = await Course.findAll();
      const user = req.user || { role: 'student', id: null };

      // Calculate stats - updated to work with mock data structure
      const stats = {
        pending: assignments.rows ? assignments.rows.filter(a => !a.submitted).length : 0,
        submitted: assignments.rows ? assignments.rows.filter(a => a.submitted).length : 0,
        overdue: assignments.rows ? assignments.rows.filter(a => new Date(a.due_date || a.dueDate) < new Date() && !a.submitted).length : 0
      };

      res.render('assignments/list', {
        title: 'Assignments',
        assignments: assignments.rows || assignments || [],
        courses: courses.rows || courses || [],
        stats,
        user
      });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load assignments.' });
    }
  },

  // View single assignment
  getAssignment: async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res
          .status(404)
          .render('error', { title: 'Not Found', message: 'Assignment not found' });
      }

      const user = req.user || { role: 'student', id: null };
      
      // Check if student has already submitted
      let existingSubmission = null;
      if (user.role === 'student' && user.id) {
        existingSubmission = await Submission.findByAssignmentAndStudent(req.params.id, user.id);
      }

      res.render('assignments/view', { 
        title: assignment.title, 
        assignment, 
        user,
        existingSubmission 
      });
    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load assignment.' });
    }
  },

  // Alias so /assignments/view/:id works
  viewAssignment: async (req, res) => {
    return assignmentController.getAssignment(req, res);
  },

  // Show assignment submission form for students
  showSubmitForm: async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const studentId = req.user.id;
      
      console.log(`Loading submission form for assignment ${assignmentId}, student ${studentId}`);
      
      // Fetch assignment details
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).render('error', {
          title: 'Not Found',
          message: 'Assignment not found'
        });
      }

      // Check if student is enrolled in the course - skip for now if method doesn't exist
      let isEnrolled = true;
      if (Course.isStudentEnrolled) {
        isEnrolled = await Course.isStudentEnrolled(assignment.courseId, studentId);
      }
      
      if (!isEnrolled) {
        return res.status(403).render('error', {
          title: 'Access Denied',
          message: 'You are not enrolled in this course'
        });
      }

      // Check if assignment is still open - handle both due_date and dueDate
      const dueDate = assignment.due_date || assignment.dueDate;
      const now = new Date();
      if (now > new Date(dueDate)) {
        return res.status(400).render('error', {
          title: 'Submission Closed',
          message: 'Assignment submission is closed'
        });
      }

      // Check if student already submitted
      const existingSubmission = await Submission.findByAssignmentAndStudent(assignmentId, studentId);

      res.render('student/submit-assignment', {
        title: `Submit Assignment - ${assignment.title}`,
        assignment: assignment,
        existingSubmission: existingSubmission,
        user: req.user
      });
      
    } catch (error) {
      console.error('Show submit form error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load submission form'
      });
    }
  },

  // Handle assignment submission
  submitAssignment: async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const studentId = req.user.id;
      
      console.log(`Submitting assignment ${assignmentId} for student ${studentId}`);
      
      // Fetch assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check due date - handle both due_date and dueDate
      const dueDate = assignment.due_date || assignment.dueDate;
      const now = new Date();
      if (now > new Date(dueDate)) {
        return res.status(400).json({
          success: false,
          message: 'Assignment submission is closed'
        });
      }

      // Check if already submitted
      const existingSubmission = await Submission.findByAssignmentAndStudent(assignmentId, studentId);
      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment'
        });
      }

      // Handle file upload
      let submissionFile = null;
      if (req.files && req.files.submissionFile) {
        const file = req.files.submissionFile;
        
        // Validate file type and size
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.pptx', '.xlsx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, ZIP, PPTX, XLSX'
          });
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum 10MB allowed'
          });
        }
        
        // Generate unique filename
        const fileName = `submission_${assignmentId}_${studentId}_${Date.now()}${fileExtension}`;
        
        // For now, just store the filename since we don't have file upload setup
        // const uploadPath = require('path').join(__dirname, '../uploads/assignments', fileName);
        // await file.mv(uploadPath);
        
        submissionFile = fileName;
        console.log(`File would be saved as: ${fileName}`);
      }

      // Validate that either text or file is provided
      if (!req.body.submissionText && !submissionFile) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either text submission or upload a file'
        });
      }

      // Create submission record
      const submissionData = {
        assignmentId: assignmentId,
        studentId: studentId,
        submissionText: req.body.submissionText || '',
        submissionFile: submissionFile,
        submittedAt: new Date(),
        status: now > new Date(dueDate) ? 'late' : 'submitted'
      };

      const submission = await Submission.create(submissionData);

      // Update assignment submission count if method exists
      if (Assignment.incrementSubmissionCount) {
        await Assignment.incrementSubmissionCount(assignmentId);
      }

      // Log the submission
      if (auditHelper && auditHelper.logAction) {
        await auditHelper.logAction(
          studentId,
          'ASSIGNMENT_SUBMIT',
          `Submitted assignment: ${assignment.title}`,
          assignmentId
        );
      }

      res.json({
        success: true,
        message: 'Assignment submitted successfully!',
        submissionId: submission.id
      });
      
    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting assignment'
      });
    }
  },

  showCreateForm: async (req, res) => {
    try {
      const courses = await Course.findByTeacher(req.user.id);
      res.render('assignments/create', { 
        title: 'Create Assignment', 
        courses: courses.rows || courses || [], 
        user: req.user 
      });
    } catch (error) {
      console.error('Create assignment form error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load form.' });
    }
  },

  createAssignment: async (req, res) => {
    try {
      const validation = validationHelper.validateAssignment(req.body);
      if (!validation.isValid) {
        const courses = await Course.findByTeacher(req.user.id);
        return res.render('assignments/create', {
          title: 'Create Assignment',
          errors: validation.errors,
          data: req.body,
          courses: courses.rows || courses || [],
          user: req.user
        });
      }

      const assignment = await Assignment.create({ 
        ...req.body, 
        teacherId: req.user.id 
      });
      
      if (auditHelper && auditHelper.logAction) {
        await auditHelper.logAction(
          req.user.id,
          'ASSIGNMENT_CREATE',
          `Created assignment: ${assignment.title}`,
          assignment.id
        );
      }

      res.redirect('/assignments');
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to create assignment.' });
    }
  },

  showEditForm: async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res
          .status(404)
          .render('error', { title: 'Not Found', message: 'Assignment not found' });
      }

      if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
        return res
          .status(403)
          .render('error', { title: 'Access Denied', message: 'Cannot edit this assignment.' });
      }

      res.render('assignments/edit', { 
        title: `Edit ${assignment.title}`, 
        assignment, 
        user: req.user 
      });
    } catch (error) {
      console.error('Edit assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load assignment.' });
    }
  },

  updateAssignment: async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res
          .status(404)
          .render('error', { title: 'Not Found', message: 'Assignment not found' });
      }

      if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
        return res
          .status(403)
          .render('error', { title: 'Access Denied', message: 'Cannot update this assignment.' });
      }

      await Assignment.update(req.params.id, req.body);
      
      if (auditHelper && auditHelper.logAction) {
        await auditHelper.logAction(
          req.user.id,
          'ASSIGNMENT_UPDATE',
          `Updated assignment: ${assignment.title}`,
          req.params.id
        );
      }

      res.redirect('/assignments');
    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to update assignment.' });
    }
  },

  deleteAssignment: async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res
          .status(404)
          .render('error', { title: 'Not Found', message: 'Assignment not found' });
      }

      if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
        return res
          .status(403)
          .render('error', { title: 'Access Denied', message: 'Cannot delete this assignment.' });
      }

      await Assignment.delete(req.params.id);
      
      if (auditHelper && auditHelper.logAction) {
        await auditHelper.logAction(
          req.user.id,
          'ASSIGNMENT_DELETE',
          `Deleted assignment: ${assignment.title}`,
          req.params.id
        );
      }

      res.redirect('/assignments');
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to delete assignment.' });
    }
  }
};

module.exports = assignmentController;