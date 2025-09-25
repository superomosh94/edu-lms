const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const auditHelper = require('../helpers/auditHelper');
const validationHelper = require('../helpers/validationHelper');

const assignmentController = {

  // List all assignments for teacher/admin
  getAllAssignments: async (req, res) => {
    try {
      const assignments = await Assignment.findAll();
      const courses = await Course.findAll();
      const user = req.user || { role: 'student', id: null };

      // Calculate stats
      const stats = {
        pending: assignments.filter(a => !a.submitted).length,
        submitted: assignments.filter(a => a.submitted).length,
        overdue: assignments.filter(a => new Date(a.due_date) < new Date() && !a.submitted).length
      };

      res.render('assignments/list', {
        title: 'Assignments',
        assignments: assignments || [],
        courses: courses || [],
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
      res.render('assignments/view', { title: assignment.title, assignment, user });
    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load assignment.' });
    }
  },

  // Alias so /assignments/view/:id works
  viewAssignment: async (req, res) => {
    return assignmentController.getAssignment(req, res);
  },

  showCreateForm: async (req, res) => {
    try {
      const courses = await Course.findByTeacher(req.user.id);
      res.render('assignments/create', { title: 'Create Assignment', courses, user: req.user });
    } catch (error) {
      console.error('Create assignment form error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load form.' });
    }
  },

  createAssignment: async (req, res) => {
    try {
      const validation = validationHelper.validateAssignment(req.body);
      if (!validation.isValid) {
        return res.render('assignments/create', {
          title: 'Create Assignment',
          errors: validation.errors,
          data: req.body,
          user: req.user
        });
      }

      const assignment = await Assignment.create({ ...req.body, teacherId: req.user.id });
      await auditHelper.logAction(
        req.user.id,
        'ASSIGNMENT_CREATE',
        `Created assignment: ${assignment.title}`,
        assignment.id
      );

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

      res.render('assignments/edit', { title: `Edit ${assignment.title}`, assignment, user: req.user });
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
      await auditHelper.logAction(
        req.user.id,
        'ASSIGNMENT_UPDATE',
        `Updated assignment: ${assignment.title}`,
        req.params.id
      );

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
      await auditHelper.logAction(
        req.user.id,
        'ASSIGNMENT_DELETE',
        `Deleted assignment: ${assignment.title}`,
        req.params.id
      );

      res.redirect('/assignments');
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to delete assignment.' });
    }
  }
};

module.exports = assignmentController;
