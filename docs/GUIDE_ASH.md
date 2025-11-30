# 🔴 ASH's VIBE GUIDE
## Role: Master / System Architect
## Target: 5-7 tables + RLS per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Database Design** - All SQL schema & migrations
2. **Supabase Setup** - Auth, Storage, RLS policies
3. **Security** - RLS, triggers, audit logging
4. **DevOps** - Production setup, backups

---

# WEEK 1: FOUNDATION BLITZ

## Day 1 - Core Auth + Academic
**Tables to Create:**
- `profiles` - Add columns: phone, address, date_of_birth, gender, photo_url
- `roles` - 14 roles (super_admin, principal, department_admin, hod, exam_cell_admin, library_admin, bus_admin, canteen_admin, finance_admin, teacher, coordinator, class_teacher, mentor, student)
- `user_roles` - Link users to roles with department
- `departments` - name, short_name, hod_id
- `courses` - name, duration, total_semesters

**RLS:** Enable on all 5 tables, admin read all policy

---

## Day 2 - Students + Teachers + Subjects
**Tables to Create:**
- `students` - profile_id, enrollment_number, roll_number, course_id, department_id, current_semester, division, admission_year, status
- `teachers` - profile_id, employee_id, department_id, designation, qualification, joining_date, status
- `subjects` - department_id, code, name, credits, subject_type
- `semesters` - course_id, semester_number, start_date, end_date, is_active

**Storage Buckets:** profile-photos, teaching-materials, submissions

**Seed Data:** Create test admin, teacher, student users

---

## Day 3 - Timetable + Attendance + Notices
**Tables to Create:**
- `timetable_master` - course_id, semester_number, division, academic_year, is_active
- `periods` - timetable_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room
- `attendance_sessions` - period_id, teacher_id, subject_id, session_date, status
- `attendance_records` - session_id, student_id, status (P/A/L), marked_at
- `notices` - title, content, priority, target_audience (JSONB), published_by, status
- `events` - title, description, event_type, start_date, end_date, venue, external_link, status

---

## Day 4 - Materials + Assignments + Exams
**Tables to Create:**
- `teaching_materials` - teacher_id, subject_id, title, description, file_url, file_type, is_published
- `assignments` - teacher_id, subject_id, course_id, semester_number, title, description, due_date, max_marks
- `submissions` - assignment_id, student_id, file_url, submitted_at, marks_obtained, feedback, graded_by
- `exams` - name, type (internal/external/practical), course_id, semester_number, start_date, end_date, status
- `exam_schedule` - exam_id, subject_id, exam_date, start_time, end_time, room, max_marks

---

## Day 5 - Library + Bus + Marks
**Tables to Create:**
- `books` - title, author, isbn, publisher, category, total_copies, available_copies
- `book_issues` - book_id, student_id, issue_date, due_date, return_date, fine_amount, status
- `bus_routes` - route_name, description, is_active
- `bus_stops` - route_id, stop_name, stop_order, arrival_time, fee
- `bus_subscriptions` - student_id, route_id, stop_id, academic_year, status, approved_by
- `internal_marks` - exam_schedule_id, student_id, teacher_id, marks_obtained, is_absent, is_verified
- `external_uploads` - student_id, subject_id, semester_number, file_url, marks_obtained, status, rejection_reason

---

# WEEK 2: CANTEEN + FEES + TEACHER TABLES

## Day 6 - Canteen + Fees + Settings
**Tables to Create:**
- `canteen_menu_items` - name, category, price, available_quantity, is_available, available_days (JSONB)
- `canteen_tokens` - student_id, token_number, total_amount, status (pending/preparing/ready/collected)
- `token_items` - token_id, menu_item_id, quantity, price
- `fees_structure` - course_id, fee_type, amount, semester_number, academic_year
- `fee_payments` - student_id, fees_structure_id, amount_paid, payment_date, payment_method, transaction_id, receipt_number
- `app_settings` - key, value (JSONB), category

---

## Day 7 - Honors + Teacher Tables
**Tables to Create:**
- `honors_minor_programs` - title, type (honors/minor), department_id, description, eligibility_criteria, total_seats, filled_seats, is_accepting_applications
- `honors_minor_enrollments` - student_id, program_id, status, enrolled_at
- `lesson_plans` - teacher_id, subject_id, topic, objectives, content_outline, planned_date, actual_date, status
- `teacher_diary` - teacher_id, subject_id, date, period_number, topic_covered, homework_assigned, remarks
- `feedback` - student_id, category, subject, message, is_anonymous, status, response, responded_by
- `student_settings` - student_id, notification_attendance, notification_assignments, notification_exams, notification_announcements

---

## Day 8 - Teacher Link Tables + RLS
**Tables to Create:**
- `teacher_subjects` - teacher_id, subject_id, academic_year
- `teacher_classes` - teacher_id, course_id, semester_number, division, role (subject_teacher/class_teacher/mentor), academic_year

**Helper Functions:**
- `has_role(role_name)` - Check if user has specific role
- `is_admin()` - Check if user is any admin role

**Enable RLS:** On all tables created so far

---

## Day 9 - Triggers + Storage
**Triggers to Create:**
- Token number generator (auto-generate TKN + date + sequence)
- Auto create student settings on student insert
- Audit logging for critical tables

**Storage Policies:** Set proper RLS on all buckets

---

## Day 10 - Full RLS Review
- Test all policies with different user roles
- Fix any security issues
- Document all policies

---

# WEEK 3-4: ROLE-SPECIFIC RLS + FINAL

## Days 11-15: Teacher & Student RLS
- Teacher can only see their classes/subjects
- Student can only see their own data
- HoD can see department data
- Coordinator can see exam data

## Days 16-20: Polish + Production
- Audit logging triggers
- Performance indexes
- Production Supabase setup
- Backup strategies

---

# ✅ DAILY CHECKLIST

## Each Day
- [ ] Create tables in migration file
- [ ] Add RLS policies
- [ ] Test with different roles
- [ ] Commit and push
- [ ] Update Hasura tracking (notify Abin)

## Storage Buckets (Day 2)
- [ ] profile-photos (public read)
- [ ] teaching-materials (authenticated read)
- [ ] submissions (authenticated read)
- [ ] external-uploads (authenticated read)

---

*Vibe Coder Ash - Ship 5+ tables daily! 🚀*
