-- Migration: Add composite indexes for performance
-- Created: 2026-01-24
-- Issue: H13 from COLLEGE_APP_ANALYSIS_2026-01-24.md

-- Timetable entries are often filtered by teacher + academic year + day
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_year_day 
  ON timetable_entries(teacher_id, academic_year_id, day_of_week);

-- Lesson planner weeks by teacher + date range
CREATE INDEX IF NOT EXISTS idx_lesson_planner_teacher_date 
  ON lesson_planner_weeks(teacher_id, week_start_date);

-- Attendance sessions by teacher + academic year + date
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_year_date 
  ON attendance_sessions(teacher_id, academic_year_id, session_date);

-- Assignments by teacher + due date for pending queries
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_due 
  ON assignments(teacher_id, due_date);

-- Additional performance indexes for common query patterns
-- User roles by user + active status
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active 
  ON user_roles(user_id, is_active) 
  WHERE is_active = true;

-- Students by year + section for class lists
CREATE INDEX IF NOT EXISTS idx_students_year_section 
  ON students(year_id, section_id);

-- Notices by scope for filtering
CREATE INDEX IF NOT EXISTS idx_notices_scope_created 
  ON notices(scope, created_at DESC);
