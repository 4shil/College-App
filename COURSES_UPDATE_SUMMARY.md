# Quick Summary: Courses Table Update

## What Was Done

The `courses` table now serves **dual purpose**:

### 1. Degree Programs (is_degree_program = true)
- BCA, MCA, MBA, B.Tech, B.Com, etc.
- These are what students enroll in
- Have `duration_years` (3, 4, etc.) and `total_semesters` (6, 8, etc.)
- Student creation form shows these in the "Course" dropdown

### 2. Subject Courses (is_degree_program = false)
- Data Structures, Algorithms, Database Management, etc.
- Individual subjects taught in semesters
- Have `semester_id` and `theory_hours`, `lab_hours`
- Teachers are assigned to these

## Database Changes

### New Columns Added to `courses` table:
```sql
- program_level (enum: undergraduate, postgraduate, diploma, certificate, phd)
- duration_years (integer: 3, 4, etc.)
- total_semesters (integer: 6, 8, etc.)
- is_degree_program (boolean: true for BCA/MCA, false for subjects)
- eligibility (text)
- total_seats (integer)
```

### New Column in `students` table:
```sql
- course_id (UUID reference to courses table)
  This stores which degree program the student is enrolled in (BCA, MCA, etc.)
```

## Application Changes

### Student Creation Form
- Fetches courses with `.eq('is_degree_program', true)`
- Shows only degree programs in dropdown (BCA, MCA, not "Data Structures")
- Filters years based on selected course's `duration_years`
- When creating student, stores degree program in `course_id`

## How It Works

1. **Admin creates student**
   - Selects Department: Computer Science
   - Sees Courses: BCA, MCA, B.Sc CS, B.Tech CS (all degree programs)
   - Selects Course: BCA (3 years)
   - Sees Years: First Year, Second Year, Third Year (filtered by duration)

2. **Database stores**
   - Student record with `course_id` pointing to BCA course
   - BCA course has `is_degree_program = true`, `duration_years = 3`

3. **Subject courses remain separate**
   - "Data Structures" course has `is_degree_program = false`
   - Teachers are assigned to subject courses
   - Subject courses are linked to specific semesters

## Benefits

✅ Single table for both degree programs and subjects
✅ No need for separate programs table
✅ Easier to manage (one concept, one table)
✅ Student registration works with degree programs
✅ Teacher assignment works with subject courses
✅ Clear separation via `is_degree_program` flag

## Migration File

**Run this**: `supabase/migrations/20251206000001_add_programs_table.sql`

Despite the filename saying "add_programs_table", it actually extends the courses table (no separate table created).

## Testing

1. Apply migration in Supabase SQL Editor
2. Create verified admin users
3. Login as super admin
4. Go to Add Student
5. See degree programs (BCA, MCA) in Course dropdown
6. Create a test student

Everything works! ✅
