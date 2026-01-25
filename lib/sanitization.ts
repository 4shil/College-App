/**
 * Sanitization utilities for user input
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize HTML/script content from user input
 * Removes potentially dangerous HTML tags and attributes
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove dangerous tags
  sanitized = sanitized.replace(/<(iframe|embed|object|link|meta|base)[^>]*>/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize user input for plain text
 * Removes all HTML tags and dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized plain text
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitize SQL-like characters (basic protection)
 * Note: Always use parameterized queries for actual SQL protection
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeSqlLike(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove or escape potentially dangerous SQL characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comment syntax
    .trim();
}

/**
 * Sanitize email input
 * Ensures valid email format and removes dangerous characters
 * @param email - Email string to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.toLowerCase().trim();
  
  // Basic email validation regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except + for international format
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Allow only digits and leading +
  const sanitized = phone.trim().replace(/[^\d+]/g, '');
  
  // Ensure + is only at the start
  if (sanitized.startsWith('+')) {
    return '+' + sanitized.slice(1).replace(/\+/g, '');
  }
  
  return sanitized.replace(/\+/g, '');
}

/**
 * Sanitize URL
 * Ensures valid http/https protocol and removes dangerous schemes
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return url.trim();
  }
  
  return '';
}

/**
 * Sanitize file path
 * Prevents path traversal attacks
 * @param path - File path to sanitize
 * @returns Sanitized path
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = path.replace(/\.\./g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Normalize slashes
  sanitized = sanitized.replace(/\\/g, '/');
  
  // Remove leading slashes (security measure)
  sanitized = sanitized.replace(/^\/+/, '');
  
  return sanitized.trim();
}

/**
 * Sanitize alphanumeric input
 * Only allows letters, numbers, and specified special characters
 * @param input - String to sanitize
 * @param allowedSpecialChars - Additional allowed characters (default: space, hyphen, underscore)
 * @returns Sanitized string
 */
export function sanitizeAlphanumeric(
  input: string,
  allowedSpecialChars: string = ' -_'
): string {
  if (typeof input !== 'string') return '';
  
  const regex = new RegExp(`[^a-zA-Z0-9${allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
  return input.replace(regex, '').trim();
}

/**
 * Sanitize form data object
 * Applies appropriate sanitization to each field
 * @param data - Form data object
 * @param fieldTypes - Map of field names to sanitization types
 * @returns Sanitized data object
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldTypes: Partial<Record<keyof T, 'text' | 'html' | 'email' | 'phone' | 'url' | 'alphanumeric'>>
): T {
  const sanitized = { ...data };
  
  for (const [field, type] of Object.entries(fieldTypes)) {
    const value = sanitized[field as keyof T];
    
    if (typeof value === 'string') {
      switch (type) {
        case 'html':
          sanitized[field as keyof T] = sanitizeHtml(value) as any;
          break;
        case 'email':
          sanitized[field as keyof T] = sanitizeEmail(value) as any;
          break;
        case 'phone':
          sanitized[field as keyof T] = sanitizePhone(value) as any;
          break;
        case 'url':
          sanitized[field as keyof T] = sanitizeUrl(value) as any;
          break;
        case 'alphanumeric':
          sanitized[field as keyof T] = sanitizeAlphanumeric(value) as any;
          break;
        case 'text':
        default:
          sanitized[field as keyof T] = sanitizePlainText(value) as any;
          break;
      }
    }
  }
  
  return sanitized;
}

/**
 * Escape special characters for use in regular expressions
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
