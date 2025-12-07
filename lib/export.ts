// Export utility functions for generating CSV reports
// Note: Full file system export is disabled until FileSystem API is properly configured

import { Alert } from 'react-native';

/**
 * Convert array of objects to CSV string
 */
export const arrayToCSV = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return csvHeaders.map(header => {
      const value = item[header];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${dataRows}`;
};

/**
 * Export data as CSV (currently logs to console - file export coming soon)
 */
export const exportToCSV = async (
  data: any[],
  filename: string,
  headers?: string[]
): Promise<void> => {
  try {
    if (!data || data.length === 0) {
      Alert.alert('No Data', 'There is no data to export');
      return;
    }

    const csv = arrayToCSV(data, headers);
    console.log(`CSV Export (${filename}):`, csv);
    Alert.alert('Export Ready', `CSV data for ${filename} logged to console. File export coming soon!`);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    Alert.alert('Export Error', 'Failed to export CSV file');
  }
};

/**
 * Export comprehensive report with table data
 */
export const exportReport = async (
  title: string,
  data: any[],
  filename: string,
  format: 'csv' | 'html' = 'csv'
): Promise<void> => {
  if (format === 'csv') {
    await exportToCSV(data, filename);
  } else {
    console.log(`HTML Export for ${filename}:`, data);
    Alert.alert('Export Ready', 'HTML export logged to console');
  }
};

/**
 * Export students data
 */
export const exportStudents = async (students: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = students.map(s => ({
    'Registration No': s.registration_number,
    'Name': s.profile?.full_name || 'N/A',
    'Email': s.profile?.email || 'N/A',
    'Department': s.department?.name || 'N/A',
    'Semester': s.semester,
    'Status': s.current_status,
  }));

  await exportReport('Students Report', formattedData, `students_${Date.now()}`, format);
};

/**
 * Export teachers data
 */
export const exportTeachers = async (teachers: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = teachers.map(t => ({
    'Employee ID': t.employee_id,
    'Name': t.profile?.full_name || 'N/A',
    'Email': t.profile?.email || 'N/A',
    'Department': t.department?.name || 'N/A',
    'Specialization': t.specialization || 'N/A',
    'Status': t.employment_status,
  }));

  await exportReport('Teachers Report', formattedData, `teachers_${Date.now()}`, format);
};

/**
 * Export attendance data
 */
export const exportAttendance = async (attendance: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = attendance.map(a => ({
    'Date': new Date(a.date).toLocaleDateString(),
    'Student': a.student?.profile?.full_name || 'N/A',
    'Course': a.course?.name || 'N/A',
    'Status': a.status,
    'Marked By': a.marked_by?.full_name || 'N/A',
  }));

  await exportReport('Attendance Report', formattedData, `attendance_${Date.now()}`, format);
};

/**
 * Export marks data
 */
export const exportMarks = async (marks: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = marks.map(m => ({
    'Student': m.student?.profile?.full_name || 'N/A',
    'Course': m.course?.name || 'N/A',
    'Exam': m.exam?.name || 'N/A',
    'Marks Obtained': m.marks_obtained,
    'Max Marks': m.max_marks,
    'Percentage': `${((m.marks_obtained / m.max_marks) * 100).toFixed(2)}%`,
  }));

  await exportReport('Marks Report', formattedData, `marks_${Date.now()}`, format);
};

/**
 * Export fees data
 */
export const exportFees = async (payments: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = payments.map(p => ({
    'Student': p.student?.profile?.full_name || 'N/A',
    'Amount': `₹${p.amount}`,
    'Payment Date': new Date(p.payment_date).toLocaleDateString(),
    'Method': p.payment_method,
    'Status': p.status,
    'Receipt No': p.receipt_number,
  }));

  await exportReport('Fees Report', formattedData, `fees_${Date.now()}`, format);
};

/**
 * Export audit logs
 */
export const exportAuditLogs = async (logs: any[], format: 'csv' | 'html' = 'csv') => {
  const formattedData = logs.map(l => ({
    'Date': new Date(l.created_at).toLocaleString(),
    'User': l.user_name,
    'Action': l.action,
    'Entity Type': l.entity_type,
    'Entity ID': l.entity_id?.substring(0, 8),
    'IP Address': l.ip_address || 'N/A',
  }));

  await exportReport('Audit Logs', formattedData, `audit_logs_${Date.now()}`, format);
};
