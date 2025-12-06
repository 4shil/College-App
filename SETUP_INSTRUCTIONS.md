# Setup Instructions: Degree Programs & Verified Admin Users

## Overview
Two major updates have been completed:
1. **Extended Courses Table**: Courses table now supports both degree programs (BCA, MCA, B.Tech) AND individual subjects
2. **Verified Admin Users**: SQL script to create pre-verified admin accounts

---

## Part 1: Extend Courses Table for Degree Programs

### What Changed
- The `courses` table now serves dual purpose:
  - **Degree Programs**: BCA, MCA, MBA, B.Tech (with `is_degree_program = true`)
  - **Subject Courses**: Data Structures, Algorithms (with `is_degree_program = false`)
- Added new columns: `program_level`, `duration_years`, `total_semesters`, `is_degree_program`
- Student creation form filters courses by `is_degree_program = true` to show only degree programs

### Migration File
**File**: `supabase/migrations/20251206000001_add_programs_table.sql`

### What the Migration Does
1. Creates `program_level` enum (undergraduate, postgraduate, diploma, certificate, phd)
2. Adds new columns to `courses` table:
   - `program_level` - Type of degree program
   - `duration_years` - Duration (e.g., 3 for BCA, 4 for B.Tech)
   - `total_semesters` - Total semesters (e.g., 6 for 3-year, 8 for 4-year)
   - `is_degree_program` - Boolean to distinguish degree programs from subject courses
   - `eligibility` - Eligibility criteria
   - `total_seats` - Number of seats
3. Makes `semester_id` nullable (degree programs span multiple semesters)
4. Adds `course_id` column to `students` table (references their degree program)
5. Inserts 8 degree programs:
   - BCA (3 years, 6 semesters)
   - MCA (2 years, 4 semesters)
   - BBA (3 years, 6 semesters)
   - MBA (2 years, 4 semesters)
   - B.Com (3 years, 6 semesters)
   - B.Sc CS (3 years, 6 semesters)
   - B.Tech CS (4 years, 8 semesters)
   - M.Tech CS (2 years, 4 semesters)

### How to Apply
Run this in **Supabase SQL Editor**:
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20251206000001_add_programs_table.sql
```

Or via CLI:
```bash
supabase db push
```

### Updated Files
- ✅ `app/(admin)/users/students/create.tsx` - Updated to use degree programs from courses table
  - Course interface includes `is_degree_program`, `program_level`, `duration_years`
  - Query filters: `.eq('is_degree_program', true)` to fetch only degree programs
  - Form shows "Course" label but displays degree programs (BCA, MCA, etc.)
  - Years filter based on selected course's duration

---

## Part 2: Create Verified Admin Users

### What Changed
- Old script created unverified users (required email verification)
- New SQL script creates verified users directly in database
- All 9 admin roles included with proper credentials

### SQL File
**File**: `scripts/create-verified-admin-users.sql`

### What the Script Does
1. **Deletes old test users** (if they exist)
2. **Creates 9 verified admin users** in `auth.users` with:
   - Fixed UUIDs for consistency
   - `email_confirmed_at` set to NOW() (verified!)
   - Full metadata (name, phone)
3. **Creates profiles** in `public.profiles` table
4. **Assigns roles** in `public.user_roles` table

### Admin Accounts Created

| Role | Email | Password | Name |
|------|-------|----------|------|
| Super Admin | superadmin@college.com | Super@2024 | Robert Johnson |
| Principal | principal@college.com | Principal@2024 | Dr. Sarah Williams |
| Exam Cell Admin | examadmin@college.com | Exam@2024 | Michael Brown |
| Library Admin | librarian@college.com | Library@2024 | Emily Davis |
| Finance Admin | financeadmin@college.com | Finance@2024 | David Martinez |
| HOD | hod@college.com | HOD@2024 | Prof. James Wilson |
| Department Admin | deptadmin@college.com | DeptAdmin@2024 | Lisa Anderson |
| Bus Admin | busadmin@college.com | Bus@2024 | Christopher Lee |
| Canteen Admin | canteenadmin@college.com | Canteen@2024 | Jessica Taylor |

### How to Apply
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `scripts/create-verified-admin-users.sql`
3. Click **Run**
4. All users will be created with verified emails

### Benefits
- ✅ No email verification needed
- ✅ Can login immediately
- ✅ All roles pre-assigned
- ✅ Consistent UUIDs (easier to debug)
- ✅ No rate limiting issues

---

## Complete Setup Process

### Step 1: Apply Courses Extension Migration
```bash
# Option A: CLI
supabase db push

# Option B: Manual
# Copy supabase/migrations/20251206000001_add_programs_table.sql
# Paste in Supabase SQL Editor
# Run
```

### Step 2: Create Verified Admin Users
```bash
# In Supabase SQL Editor:
# Copy scripts/create-verified-admin-users.sql
# Paste and Run
```

### Step 3: Test Student Creation
1. Login as `superadmin@college.com` / `Super@2024`
2. Navigate to **Users** → **Students** → **Add Student**
3. Select Department → See degree programs filter automatically (BCA, MCA, etc.)
4. Select Course (degree program) → See years filter based on program duration
5. Create a test student

### Step 4: Test Each Admin Role
Login with each account to verify:
- **Super Admin**: Sees all 5 tabs, full dashboard, all modules
- **Principal**: Sees 5 tabs, full dashboard, user management
- **Library Admin**: Sees 3 tabs, welcome card, Library module only
- **Finance Admin**: Sees 3 tabs, welcome card, Fees module only
- **Exam Cell Admin**: Sees 3 tabs, welcome card, Exams module only
- **HOD**: Sees 4 tabs, department notices, attendance
- **Dept Admin**: Sees 4 tabs, department users only
- **Bus Admin**: Sees 3 tabs, Bus module only
- **Canteen Admin**: Sees 3 tabs, Canteen module only

---

## Verification Checklist

### Courses Table Extension
- [ ] Migration applied successfully
- [ ] `courses` table has new columns: `is_degree_program`, `program_level`, `duration_years`, `total_semesters`
- [ ] 8 degree programs inserted (BCA, MCA, MBA, etc.) with `is_degree_program = true`
- [ ] `students` table has `course_id` column
- [ ] Student creation form loads without errors
- [ ] Department selection filters degree programs correctly
- [ ] Course selection shows only degree programs (BCA, MCA, not subject courses)
- [ ] Year selection filters based on course duration

### Admin Users
- [ ] SQL script executed successfully
- [ ] 9 users visible in Supabase Authentication
- [ ] All emails show as "Confirmed" (green checkmark)
- [ ] Can login with any of the 9 accounts
- [ ] Each role sees appropriate navigation tabs
- [ ] Each role sees appropriate dashboard content
- [ ] Role assignment UI works (super admin only)

---

## Troubleshooting

### Issue: Migration fails - columns already exist
```sql
-- Check current courses table structure:
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'courses';

-- If columns exist, migration is already applied
```

### Issue: No degree programs showing in dropdown
```sql
-- Check if degree programs exist:
SELECT code, name, is_degree_program FROM courses WHERE is_degree_program = true;

-- If empty, run the INSERT statements from the migration
```

### Issue: Admin user creation fails - users already exist
```sql
-- Run this to delete old users:
DELETE FROM auth.users WHERE email LIKE '%@college.com';
-- Then run the script again
```

### Issue: Student creation fails - course_id constraint
Make sure the migration was applied before creating students.

### Issue: Can't see degree programs in dropdown
Check that:
1. Migration was applied
2. Degree programs were inserted with `is_degree_program = true`
3. Departments exist and match the department codes in the INSERT statements
4. Student form query includes `.eq('is_degree_program', true)`

---

## Files Modified

### New Files
1. `supabase/migrations/20251206000001_add_programs_table.sql` - Extends courses table for degree programs
2. `scripts/create-verified-admin-users.sql` - Verified admin users SQL
3. `ADMIN_CREDENTIALS.md` - Credentials reference
4. `SETUP_INSTRUCTIONS.md` - This file

### Modified Files
1. `app/(admin)/users/students/create.tsx` - Updated to query degree programs
   - Course interface updated with degree program fields
   - Query filters by `is_degree_program = true`
   - Year filtering based on course duration_years

---

## Next Steps

After setup is complete:

1. **Add More Degree Programs**: Use Supabase dashboard to add department-specific programs
   ```sql
   INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active)
   VALUES ('YOUR-CODE', 'Program Name', 'Short Name', 'dept-uuid', true, 'undergraduate', 3, 6, true);
   ```
2. **Add Subject Courses**: Add individual subjects with `is_degree_program = false`
3. **Test Student Registration**: Create test students in different degree programs
4. **Test Role-Based Access**: Validate each admin role's permissions
5. **Production Ready**: System is ready for real user testing

---

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Verify TypeScript compiles: `npx tsc --noEmit`
3. Check browser console for runtime errors
4. Verify database state in Table Editor
