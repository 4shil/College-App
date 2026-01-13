/**
 * Grade Calculator Utility
 * Calculates SGPA, CGPA, and grade points based on marks
 */

// Grade Point System (10-point scale)
export const GRADE_SCALE = {
  'O': 10,  // Outstanding (90-100)
  'A+': 9,  // Excellent (80-89)
  'A': 8,   // Very Good (70-79)
  'B+': 7,  // Good (60-69)
  'B': 6,   // Above Average (55-59)
  'C': 5,   // Average (50-54)
  'P': 4,   // Pass (40-49)
  'F': 0,   // Fail (<40)
  'AB': 0,  // Absent
} as const;

export type Grade = keyof typeof GRADE_SCALE;

/**
 * Convert percentage to grade
 */
export function percentageToGrade(percentage: number): Grade {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 55) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'P';
  return 'F';
}

/**
 * Get grade point for a percentage
 */
export function getGradePoint(percentage: number): number {
  const grade = percentageToGrade(percentage);
  return GRADE_SCALE[grade];
}

/**
 * Subject grade information
 */
export interface SubjectGrade {
  subjectName: string;
  subjectCode: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  isAbsent?: boolean;
  percentage: number;
  grade: Grade;
  gradePoint: number;
  creditPoints: number; // grade_point × credits
}

/**
 * Calculate grade information for a subject
 */
export function calculateSubjectGrade(
  subjectName: string,
  subjectCode: string,
  credits: number,
  marksObtained: number,
  maxMarks: number,
  isAbsent: boolean = false
): SubjectGrade {
  if (isAbsent) {
    return {
      subjectName,
      subjectCode,
      credits,
      marksObtained: 0,
      maxMarks,
      isAbsent: true,
      percentage: 0,
      grade: 'AB',
      gradePoint: 0,
      creditPoints: 0,
    };
  }

  const percentage = (marksObtained / maxMarks) * 100;
  const grade = percentageToGrade(percentage);
  const gradePoint = GRADE_SCALE[grade];
  const creditPoints = gradePoint * credits;

  return {
    subjectName,
    subjectCode,
    credits,
    marksObtained,
    maxMarks,
    isAbsent: false,
    percentage,
    grade,
    gradePoint,
    creditPoints,
  };
}

/**
 * SGPA Calculation Result
 */
export interface SGPAResult {
  sgpa: number;
  totalCredits: number;
  totalCreditPoints: number;
  subjects: SubjectGrade[];
  passed: boolean;
  failedSubjects: string[];
}

/**
 * Calculate SGPA (Semester Grade Point Average)
 * SGPA = Σ(Credit Points) / Σ(Credits)
 */
export function calculateSGPA(subjects: SubjectGrade[]): SGPAResult {
  if (subjects.length === 0) {
    return {
      sgpa: 0,
      totalCredits: 0,
      totalCreditPoints: 0,
      subjects: [],
      passed: false,
      failedSubjects: [],
    };
  }

  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalCreditPoints = subjects.reduce((sum, s) => sum + s.creditPoints, 0);
  const sgpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;

  const failedSubjects = subjects
    .filter(s => s.grade === 'F' || s.grade === 'AB')
    .map(s => s.subjectCode);

  const passed = failedSubjects.length === 0;

  return {
    sgpa: Math.round(sgpa * 100) / 100, // Round to 2 decimal places
    totalCredits,
    totalCreditPoints,
    subjects,
    passed,
    failedSubjects,
  };
}

/**
 * CGPA Calculation Result
 */
export interface CGPAResult {
  cgpa: number;
  totalCredits: number;
  totalCreditPoints: number;
  semesters: SGPAResult[];
  overallPassed: boolean;
}

/**
 * Calculate CGPA (Cumulative Grade Point Average)
 * CGPA = Σ(All Credit Points) / Σ(All Credits)
 */
export function calculateCGPA(semesters: SGPAResult[]): CGPAResult {
  if (semesters.length === 0) {
    return {
      cgpa: 0,
      totalCredits: 0,
      totalCreditPoints: 0,
      semesters: [],
      overallPassed: false,
    };
  }

  const totalCredits = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);
  const totalCreditPoints = semesters.reduce((sum, sem) => sum + sem.totalCreditPoints, 0);
  const cgpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;

  const overallPassed = semesters.every(sem => sem.passed);

  return {
    cgpa: Math.round(cgpa * 100) / 100, // Round to 2 decimal places
    totalCredits,
    totalCreditPoints,
    semesters,
    overallPassed,
  };
}

/**
 * Get classification based on CGPA
 */
export function getClassification(cgpa: number): string {
  if (cgpa >= 9.0) return 'First Class with Distinction';
  if (cgpa >= 7.5) return 'First Class';
  if (cgpa >= 6.5) return 'Second Class';
  if (cgpa >= 5.5) return 'Pass Class';
  return 'Fail';
}

/**
 * Get performance description
 */
export function getPerformanceDescription(sgpa: number): string {
  if (sgpa >= 9.0) return 'Outstanding';
  if (sgpa >= 8.0) return 'Excellent';
  if (sgpa >= 7.0) return 'Very Good';
  if (sgpa >= 6.0) return 'Good';
  if (sgpa >= 5.0) return 'Average';
  if (sgpa >= 4.0) return 'Pass';
  return 'Needs Improvement';
}

/**
 * Example usage:
 * 
 * const subjects = [
 *   calculateSubjectGrade('Data Structures', 'CS201', 4, 85, 100),
 *   calculateSubjectGrade('Computer Networks', 'CS202', 4, 78, 100),
 *   calculateSubjectGrade('DBMS', 'CS203', 4, 92, 100),
 * ];
 * 
 * const sgpaResult = calculateSGPA(subjects);
 * console.log(`SGPA: ${sgpaResult.sgpa}`);
 * 
 * const allSemesters = [sgpaResult, ...otherSemesters];
 * const cgpaResult = calculateCGPA(allSemesters);
 * console.log(`CGPA: ${cgpaResult.cgpa}`);
 */
