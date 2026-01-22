/**
 * Date Utilities
 * Centralized date formatting and manipulation functions
 */

/**
 * Convert a Date to ISO date string (YYYY-MM-DD) in local timezone
 * Use this for database date fields that don't need time
 */
export function toDateOnlyISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return toDateOnlyISO(new Date());
}

/**
 * Get a date N days from now as ISO string
 */
export function getDateNDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateOnlyISO(date);
}

/**
 * Parse an ISO date string to a Date object (at midnight local time)
 */
export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date for display (e.g., "Jan 15, 2026")
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date for short display (e.g., "Jan 15")
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISODate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISODate(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get day name (e.g., "Monday")
 */
export function getDayName(date: Date | string): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get short day name (e.g., "Mon")
 */
export function getDayNameShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
