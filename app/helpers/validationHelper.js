const validator = require('validator');

exports.validateEmail = (email) => {
  return validator.isEmail(email) && validator.isLength(email, { max: 150 });
};

exports.validatePassword = (password) => {
  return validator.isLength(password, { min: 8 }) &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};

exports.validateName = (name) => {
  return validator.isLength(name, { min: 2, max: 120 }) &&
         validator.isAlpha(name.replace(/\s/g, ''));
};

exports.validateCourseCode = (code) => {
  return validator.isLength(code, { min: 2, max: 30 }) &&
         validator.isAlphanumeric(code.replace(/[-_]/g, ''));
};

exports.validateAmount = (amount) => {
  return validator.isCurrency(amount.toString(), {
    allow_negatives: false,
    digits_after_decimal: [2]
  });
};

exports.sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(validator.trim(input));
  }
  return input;
};

exports.validateAssignmentData = (data) => {
  const errors = [];
  
  if (!data.title || !validator.isLength(data.title, { min: 5, max: 255 })) {
    errors.push('Title must be between 5 and 255 characters');
  }
  
  if (data.description && !validator.isLength(data.description, { max: 1000 })) {
    errors.push('Description too long');
  }
  
  if (data.max_grade && !validator.isFloat(data.max_grade.toString(), { min: 0, max: 1000 })) {
    errors.push('Max grade must be a number between 0 and 1000');
  }
  
  if (data.due_date && !validator.isISO8601(data.due_date)) {
    errors.push('Due date must be a valid date');
  }
  
  return errors;
};