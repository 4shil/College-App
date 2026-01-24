/**
 * Input Validation Utilities
 * Centralized validation functions for form inputs
 */

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Phone number validation (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Password strength validation
 * Returns validation result with message
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least 2 of: uppercase, lowercase, numbers, special characters
 * - Cannot be a common password pattern
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters',
      strength: 'weak',
    };
  }

  // Check for common weak patterns
  const commonPatterns = [
    /^12345678$/,
    /^password$/i,
    /^qwerty/i,
    /^abc123/i,
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789)+$/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Sequential letters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      return {
        isValid: false,
        message: 'Password is too common or predictable',
        strength: 'weak',
      };
    }
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/`~]/.test(password);

  const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  // Require at least 2 character types for validity
  if (score < 2) {
    return {
      isValid: false,
      message: 'Password must include at least 2 of: uppercase, lowercase, numbers, special characters',
      strength: 'weak',
    };
  }

  if (password.length >= 12 && score >= 3) {
    return {
      isValid: true,
      message: 'Strong password',
      strength: 'strong',
    };
  }

  if (password.length >= 8 && score >= 3) {
    return {
      isValid: true,
      message: 'Good password',
      strength: 'medium',
    };
  }

  return {
    isValid: true,
    message: 'Acceptable password - consider adding more character types for extra security',
    strength: 'medium',
  };
}

/**
 * Name validation (no special characters except spaces, dots, hyphens)
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[a-zA-Z\s.\-']+$/;
  return nameRegex.test(name.trim());
}

/**
 * Sanitize string input (remove leading/trailing whitespace, normalize spaces)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate non-empty required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate number within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate marks (0-100 or 0 to maxMarks)
 */
export function isValidMarks(marks: number, maxMarks: number = 100): boolean {
  return !isNaN(marks) && marks >= 0 && marks <= maxMarks;
}

/**
 * Validate date string (ISO format YYYY-MM-DD)
 */
export function isValidDateISO(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate admission number format (alphanumeric, min 3 chars)
 */
export function isValidAdmissionNo(admissionNo: string): boolean {
  if (!admissionNo || admissionNo.length < 3) return false;
  const admissionRegex = /^[A-Za-z0-9/-]+$/;
  return admissionRegex.test(admissionNo);
}

/**
 * Validate roll number
 */
export function isValidRollNo(rollNo: string): boolean {
  if (!rollNo) return false;
  // Allow numbers and alphanumeric
  return /^[A-Za-z0-9]+$/.test(rollNo);
}

/**
 * Form validation helper - validates multiple fields
 */
export type ValidationRule = {
  value: string | number | null | undefined;
  field: string;
  required?: boolean;
  validator?: (value: any) => boolean;
  message?: string;
};

export function validateForm(rules: ValidationRule[]): {
  isValid: boolean;
  errors: { field: string; message: string }[];
} {
  const errors: { field: string; message: string }[] = [];

  for (const rule of rules) {
    // Check required
    if (rule.required && !isRequired(String(rule.value ?? ''))) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is required`,
      });
      continue;
    }

    // Run custom validator if provided and value exists
    if (rule.validator && rule.value !== null && rule.value !== undefined) {
      if (!rule.validator(rule.value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is invalid`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
