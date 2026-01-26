# 🔄 JPM College App - Semester Transition Documentation

## What Happens When Semester Ends

This document explains how the app handles academic transitions including semester changes, year promotions, teacher reassignments, and subject changes.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [Semester Transition Process](#semester-transition-process)
4. [Impact Analysis](#impact-analysis)
5. [Admin Actions Required](#admin-actions-required)
6. [Automated vs Manual Tasks](#automated-vs-manual-tasks)
7. [Data Retention & Archival](#data-retention--archival)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Academic Calendar Structure

```
Academic Year: 2024-2025
│
├── Semester 1 (Odd) ─────────── June - November
│   └── Year 1: Sem 1
│   └── Year 2: Sem 3
│   └── Year 3: Sem 5
│   └── Year 4: Sem 7
│
└── Semester 2 (Even) ────────── December - May
    └── Year 1: Sem 2
    └── Year 2: Sem 4
    └── Year 3: Sem 6
    └── Year 4: Sem 8
```

### Key Transition Points

| Transition | When | What Changes |
|------------|------|--------------|
| **Mid-Year** | Dec/Jan | Semester 1 → 2, 3 → 4, 5 → 6, 7 → 8 |
| **Year-End** | May/June | Semester 2 → 3, 4 → 5, 6 → 7, 8 → Graduated |
| **Academic Year** | June | New academic year begins |

---

## Database Structure

### Key Tables Affected

#### 1. Academic Years Table
```sql
academic_years
├── id (UUID)
├── name (e.g., "2024-2025")
├── start_date
├── end_date
├── is_current (boolean)  ← Only ONE should be true
└── is_active
```

#### 2. Years Table (1st, 2nd, 3rd, 4th Year)
```sql
years
├── id (UUID)
├── year_number (1-4)
├── name ("1st Year", etc.)
└── is_active
```

#### 3. Semesters Table
```sql
semesters
├── id (UUID)
├── semester_number (1-8)
├── name ("Semester 1", etc.)
├── year_id → years.id
└── is_active
```

#### 4. Students Table (Critical)
```sql
students
├── id
├── user_id → profiles.id
├── department_id → departments.id
├── year_id → years.id              ← MUST UPDATE
├── semester_id → semesters.id      ← MUST UPDATE
├── section_id → sections.id        ← MAY CHANGE
├── academic_year_id                ← MUST UPDATE on year-end
├── current_status                  ← May change to 'graduated'
└── ...
```

#### 5. Teacher-Course Assignments
```sql
teacher_courses
├── id
├── teacher_id → teachers.id
├── course_id → courses.id          ← Different per semester
├── section_id → sections.id
├── academic_year_id                ← MUST UPDATE yearly
└── is_active
```

#### 6. Courses/Subjects Table
```sql
courses
├── id
├── code
├── name
├── department_id
├── semester_id → semesters.id      ← Courses are semester-specific
└── is_active
```

---

## Semester Transition Process

### Phase 1: Pre-Transition Preparation (1-2 weeks before)

#### Admin Checklist
| Task | Description | Status |
|------|-------------|--------|
| ☐ | Verify all attendance marked | Required |
| ☐ | Verify all marks entered | Required |
| ☐ | Work diaries submitted & approved | Required |
| ☐ | Lesson planners submitted & approved | Required |
| ☐ | Pending assignments closed | Required |
| ☐ | Fee payments reconciled | Recommended |
| ☐ | Library books returned | Recommended |

### Phase 2: Execute Transition

#### Step 1: Freeze Current Semester Data
```sql
-- Mark current semester assignments as inactive
UPDATE assignments 
SET is_active = false 
WHERE academic_year_id = 'current-year-id' 
AND semester_id = 'current-semester-id';

-- Archive attendance records (keep, don't delete)
-- No action needed - data persists with semester_id reference
```

#### Step 2: Update Student Semesters

**Mid-Year Transition (Semester 1 → 2, 3 → 4, etc.)**
```sql
-- Update all active students to next semester
UPDATE students
SET 
    semester_id = (
        SELECT id FROM semesters 
        WHERE semester_number = (
            SELECT semester_number + 1 
            FROM semesters s 
            WHERE s.id = students.semester_id
        )
    ),
    updated_at = NOW()
WHERE current_status = 'active';
```

**Year-End Transition (Semester 2 → 3, includes year promotion)**
```sql
-- Promote students to next year
UPDATE students
SET 
    year_id = (
        SELECT id FROM years 
        WHERE year_number = (
            SELECT year_number + 1 
            FROM years y 
            WHERE y.id = students.year_id
        )
    ),
    semester_id = (
        SELECT id FROM semesters 
        WHERE semester_number = (
            SELECT semester_number + 1 
            FROM semesters s 
            WHERE s.id = students.semester_id
        )
    ),
    academic_year_id = 'new-academic-year-id',
    updated_at = NOW()
WHERE current_status = 'active'
AND year_id != (SELECT id FROM years WHERE year_number = 4);

-- Handle final year students (graduation)
UPDATE students
SET 
    current_status = 'graduated',
    updated_at = NOW()
WHERE current_status = 'active'
AND semester_id = (SELECT id FROM semesters WHERE semester_number = 8);
```

#### Step 3: Update Teacher-Course Assignments

```sql
-- Deactivate previous semester assignments
UPDATE teacher_courses
SET is_active = false
WHERE academic_year_id = 'previous-year-id'
AND is_active = true;

-- Admin manually creates new assignments OR
-- Copy and update from previous year
INSERT INTO teacher_courses (teacher_id, course_id, section_id, academic_year_id, is_active)
SELECT 
    teacher_id,
    c.new_course_id,  -- Must be mapped to new semester courses
    section_id,
    'new-academic-year-id',
    true
FROM teacher_courses tc
JOIN course_mapping cm ON tc.course_id = cm.old_course_id
WHERE tc.academic_year_id = 'previous-year-id';
```

#### Step 4: Update Sections

```sql
-- Create new sections for new academic year
INSERT INTO sections (name, department_id, year_id, academic_year_id, max_students)
SELECT 
    name,
    department_id,
    year_id,
    'new-academic-year-id',
    max_students
FROM sections
WHERE academic_year_id = 'current-year-id'
AND is_active = true;

-- Optionally reassign class teachers
UPDATE sections
SET class_teacher_id = 'new-teacher-id'
WHERE id = 'section-id';
```

#### Step 5: Set New Academic Year as Current

```sql
-- Only for year-end transitions
UPDATE academic_years SET is_current = false WHERE is_current = true;
UPDATE academic_years SET is_current = true WHERE name = '2025-2026';
```

---

## Impact Analysis

### What Changes When Semester Ends

#### For Students

| Aspect | Change | Impact |
|--------|--------|--------|
| **Semester ID** | Updated to next semester | New course list appears |
| **Subjects** | New semester subjects | Timetable changes |
| **Attendance** | Resets to 0% | Fresh start |
| **Assignments** | Previous cleared | New assignments appear |
| **Materials** | New semester materials | Access continues |
| **Marks** | Previous archived | New exam marks start |
| **Timetable** | New schedule | Different periods/rooms |

#### For Teachers

| Aspect | Change | Impact |
|--------|--------|--------|
| **Course Assignments** | May change | Different subjects to teach |
| **Section Assignments** | May change | Different students |
| **Timetable** | New schedule | Different periods |
| **Mentor Assignments** | Usually persist | Same mentees (unless reassigned) |
| **Work Diary** | New month cycle | Fresh diary for new semester |
| **Lesson Planner** | New weeks | Fresh planner for new courses |

#### For Admins

| Aspect | Change | Impact |
|--------|--------|--------|
| **Academic Year** | New year (year-end) | All references update |
| **Statistics** | Reset for new semester | Fresh counts |
| **Reports** | Previous archived | New semester reports |
| **Fee Structures** | May need update | New semester fees |

---

### Subject/Course Changes

#### How Subjects Change Per Semester

```
Department: CSE (Computer Science)

Semester 1:
├── CS101 - Programming Fundamentals
├── MA101 - Engineering Mathematics I
├── PH101 - Physics
└── EN101 - English

Semester 2:
├── CS102 - Data Structures
├── MA102 - Engineering Mathematics II
├── CH101 - Chemistry
└── CS103 - OOP with Java

... and so on for each semester
```

#### Database Query: Student's Courses
```sql
SELECT c.code, c.name, c.course_type
FROM courses c
WHERE c.semester_id = (
    SELECT semester_id FROM students WHERE user_id = 'student-user-id'
)
AND c.department_id = (
    SELECT department_id FROM students WHERE user_id = 'student-user-id'
)
AND c.is_active = true;
```

---

### Teacher Changes

#### Scenario: Teacher Reassignment

```
Before (Semester 1):
Teacher: Dr. Sharma
├── CS101 - Section A
├── CS101 - Section B
└── CS105 - Section A

After (Semester 2):
Teacher: Dr. Sharma
├── CS102 - Section A
├── CS102 - Section C     ← Different section
└── CS106 - Section B     ← Different course & section
```

#### Impact on Teacher Data
| Data | Behavior |
|------|----------|
| Attendance History | Persists (linked to old courses) |
| Assignment History | Persists (linked to old courses) |
| Materials | Persists (linked to old courses) |
| Work Diaries | Persists (archived for review) |
| Lesson Planners | Persists (archived for review) |
| New Courses | Fresh start required |

---

## Admin Actions Required

### Pre-Transition Checklist

#### 2 Weeks Before Semester End
- [ ] Notify all teachers to submit pending work diaries
- [ ] Notify all teachers to submit pending lesson planners
- [ ] Send reminder to complete all attendance marking
- [ ] Send reminder to complete all assignment grading
- [ ] Generate end-of-semester reports

#### 1 Week Before
- [ ] Verify all work diaries approved
- [ ] Verify all lesson planners approved
- [ ] Close all pending assignments
- [ ] Generate final attendance reports
- [ ] Generate marks reports
- [ ] Backup database

### Transition Day Actions

#### For Mid-Year Transition
1. **Navigate to**: Admin → Settings → Academic Year
2. **Verify**: Current academic year is correct
3. **Run**: Semester promotion script
4. **Verify**: Student semester IDs updated
5. **Update**: Teacher course assignments
6. **Update**: Timetable entries
7. **Notify**: All users of transition

#### For Year-End Transition
1. **Create**: New academic year entry
2. **Set**: New academic year as current
3. **Run**: Student promotion script
4. **Mark**: Final year students as graduated
5. **Create**: New sections for new year
6. **Assign**: Class teachers to sections
7. **Assign**: Teachers to courses
8. **Create**: New timetable
9. **Set**: New fee structures
10. **Notify**: All users

### Post-Transition Verification

| Check | Expected Result |
|-------|-----------------|
| Student semester_id | All active students in correct semester |
| Teacher course assignments | All teachers have new semester courses |
| Timetable | New timetable visible to all |
| Dashboard stats | Refreshed for new semester |
| Attendance | Reset to 0 for new semester |
| Assignments | Only new semester assignments visible |

---

## Automated vs Manual Tasks

### Currently Automated
| Task | Trigger | Notes |
|------|---------|-------|
| Data filtering by semester | Real-time | Queries filter by current semester_id |
| Attendance calculation | Real-time | Calculates for current semester only |
| Dashboard stats | Real-time | Shows current semester data |

### Currently Manual (Admin Required)
| Task | When | How |
|------|------|-----|
| Update academic year | Yearly | Admin → Settings → Academic Year |
| Promote students | Each semester | Run SQL script / Admin tool |
| Assign teachers to courses | Each semester | Admin → Academic → Teacher Courses |
| Create timetable | Each semester | Admin → Timetable → Create |
| Update fee structures | As needed | Admin → Fees → Structures |
| Mark graduates | Year-end | Automatic with promotion script |

### Recommended Automation Enhancements

#### Future Features to Implement

1. **Automated Semester Transition Wizard**
   ```
   Admin clicks "Start Semester Transition"
   → Validation checks run
   → Preview of changes shown
   → Confirm to execute
   → All updates applied atomically
   → Rollback available if issues
   ```

2. **Teacher Course Auto-Assignment**
   ```
   System suggests assignments based on:
   - Previous year same semester
   - Teacher's department
   - Teacher's specialization
   Admin reviews and confirms
   ```

3. **Graduation Automation**
   ```
   System identifies students completing Sem 8
   Admin reviews list
   Bulk status update to 'graduated'
   Alumni records created
   ```

---

## Data Retention & Archival

### What Data is Retained

| Data Type | Retention | Access |
|-----------|-----------|--------|
| **Attendance Records** | Permanent | Historical queries by date range |
| **Exam Marks** | Permanent | Historical queries by exam/semester |
| **Assignment Submissions** | Permanent | Viewable in history |
| **Work Diaries** | Permanent | Archived, read-only |
| **Lesson Planners** | Permanent | Archived, read-only |
| **Notices** | Permanent | Filterable by date |
| **Audit Logs** | Permanent | Security compliance |
| **Fee Payments** | Permanent | Financial records |

### What Data Resets

| Data Type | Reset Behavior |
|-----------|----------------|
| Current attendance % | Recalculated for new semester |
| Pending assignments | New semester assignments only |
| Active materials | New semester materials visible |
| Dashboard stats | Fresh counts for new semester |
| Timetable | New semester schedule |

### Archival Process

```sql
-- Example: Archive old semester data to archive tables

-- Archive attendance
INSERT INTO attendance_archive
SELECT * FROM attendance
WHERE academic_year_id = 'old-year-id'
AND semester_id = 'old-semester-id';

-- Archive exam marks
INSERT INTO exam_marks_archive
SELECT * FROM exam_marks
WHERE exam_id IN (
    SELECT id FROM exams 
    WHERE academic_year_id = 'old-year-id'
);
```

---

## Rollback Procedures

### If Transition Goes Wrong

#### Immediate Rollback (Within 24 hours)

```sql
-- Restore students to previous semester
UPDATE students
SET 
    semester_id = 'previous-semester-id',
    year_id = 'previous-year-id',
    academic_year_id = 'previous-academic-year-id',
    updated_at = NOW()
WHERE updated_at > 'transition-timestamp';

-- Restore academic year
UPDATE academic_years SET is_current = false WHERE is_current = true;
UPDATE academic_years SET is_current = true WHERE id = 'previous-year-id';

-- Reactivate teacher courses
UPDATE teacher_courses
SET is_active = true
WHERE academic_year_id = 'previous-year-id';
```

#### Data Recovery from Backup

1. **Identify** affected tables
2. **Restore** from backup (taken pre-transition)
3. **Verify** data integrity
4. **Notify** users of rollback

---

## Transition Timeline Example

### Semester 1 → 2 Transition (December)

```
Week 1 (Dec 1-7):
├── Mon: Send transition notice to all users
├── Tue: Teachers submit pending diaries/planners
├── Wed: Admin reviews submissions
├── Thu: Generate end-of-semester reports
└── Fri: Final verification

Week 2 (Dec 8-14):
├── Mon: Freeze Semester 1 assignments
├── Tue: Backup database
├── Wed: Execute semester transition
│   ├── Update student semester_id
│   ├── Update teacher course assignments
│   └── Update timetable
├── Thu: Verify all data correct
└── Fri: Notify users, new semester begins
```

---

## Best Practices

### Do's
✅ Always backup before transition
✅ Run in staging/test environment first
✅ Communicate timeline to all users
✅ Verify with sample students/teachers post-transition
✅ Keep rollback scripts ready
✅ Document any manual changes

### Don'ts
❌ Don't transition during peak hours
❌ Don't skip validation checks
❌ Don't delete historical data
❌ Don't forget to update ALL related tables
❌ Don't transition without teacher course assignments ready

---

## Appendix: SQL Scripts

### A. Complete Mid-Year Transition Script
```sql
-- Mid-Year Semester Transition Script
-- Run after backing up database

BEGIN TRANSACTION;

-- Step 1: Validate current state
SELECT COUNT(*) as active_students FROM students WHERE current_status = 'active';
SELECT COUNT(*) as pending_assignments FROM assignments WHERE is_active = true;

-- Step 2: Update student semesters
UPDATE students s
SET 
    semester_id = ns.id,
    updated_at = NOW()
FROM semesters cs
JOIN semesters ns ON ns.semester_number = cs.semester_number + 1
WHERE s.semester_id = cs.id
AND s.current_status = 'active'
AND cs.semester_number IN (1, 3, 5, 7); -- Odd semesters

-- Step 3: Deactivate old teacher courses
UPDATE teacher_courses SET is_active = false WHERE is_active = true;

-- Step 4: Activate new teacher courses (must be pre-created)
-- This assumes new assignments already created for new semester

-- Step 5: Verify
SELECT semester_id, COUNT(*) FROM students GROUP BY semester_id;

COMMIT;
```

### B. Complete Year-End Transition Script
```sql
-- Year-End Academic Year Transition Script
-- Run after backing up database

BEGIN TRANSACTION;

-- Step 1: Create new academic year (if not exists)
INSERT INTO academic_years (name, start_date, end_date, is_current)
VALUES ('2025-2026', '2025-06-01', '2026-05-31', false);

-- Step 2: Get new academic year ID
SELECT id INTO @new_ay_id FROM academic_years WHERE name = '2025-2026';

-- Step 3: Mark final year students as graduated
UPDATE students
SET 
    current_status = 'graduated',
    updated_at = NOW()
WHERE current_status = 'active'
AND semester_id IN (SELECT id FROM semesters WHERE semester_number = 8);

-- Step 4: Promote remaining students
UPDATE students s
SET 
    year_id = ny.id,
    semester_id = ns.id,
    academic_year_id = @new_ay_id,
    updated_at = NOW()
FROM years cy
JOIN years ny ON ny.year_number = cy.year_number + 1
JOIN semesters cs ON s.semester_id = cs.id
JOIN semesters ns ON ns.semester_number = cs.semester_number + 1
WHERE s.year_id = cy.id
AND s.current_status = 'active';

-- Step 5: Set new academic year as current
UPDATE academic_years SET is_current = false WHERE is_current = true;
UPDATE academic_years SET is_current = true WHERE id = @new_ay_id;

-- Step 6: Create new sections
INSERT INTO sections (name, department_id, year_id, academic_year_id, max_students)
SELECT name, department_id, year_id, @new_ay_id, max_students
FROM sections
WHERE academic_year_id = (SELECT id FROM academic_years WHERE name = '2024-2025')
AND is_active = true;

-- Step 7: Verify
SELECT academic_year_id, COUNT(*) FROM students GROUP BY academic_year_id;
SELECT is_current, name FROM academic_years;

COMMIT;
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Development Team*
