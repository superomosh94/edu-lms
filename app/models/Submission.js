// Mock Submission model - working version without database dependencies
class Submission {
  constructor(data) {
    this.id = data.id || Date.now();
    this.assignmentId = data.assignmentId;
    this.studentId = data.studentId;
    this.submissionText = data.submissionText || '';
    this.submissionFile = data.submissionFile || null;
    this.submittedAt = data.submittedAt || new Date();
    this.status = data.status || 'submitted';
    this.grade = data.grade || null;
    this.feedback = data.feedback || null;
    this.gradedAt = data.gradedAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findByAssignmentAndStudent(assignmentId, studentId) {
    console.log(`[Mock] Finding submission for assignment ${assignmentId}, student ${studentId}`);
    // Return null to simulate no existing submission
    return null;
  }

  static async create(data) {
    console.log('[Mock] Creating submission:', {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      hasText: !!data.submissionText,
      hasFile: !!data.submissionFile
    });
    
    const submission = new Submission(data);
    
    // Simulate database save delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return submission;
  }

  static async findByAssignment(assignmentId) {
    console.log(`[Mock] Finding submissions for assignment ${assignmentId}`);
    return [];
  }

  static async findByStudent(studentId) {
    console.log(`[Mock] Finding submissions for student ${studentId}`);
    return [];
  }

  isGraded() {
    return this.status === 'graded';
  }

  isLate() {
    return this.status === 'late';
  }
}

// Export the class directly
module.exports = Submission;