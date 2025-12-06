# Setup Instructions: Programs & Verified Admin Users

## Overview
Two major updates have been completed:
1. **Programs Table**: Separates degree programs (BCA, MCA, B.Tech, etc.) from individual subject courses
2. **Verified Admin Users**: SQL script to create pre-verified admin accounts

---

## Part 1: Add Programs Table

### What Changed
- Created `programs` table for degree programs (BCA, MCA, MBA, B.Tech, etc.)
- Updated student creation form to use `programs` instead of `courses`
- `courses` table now only stores individual subjects (like "Data Structures", "Algorithms")
- `programs` table stores degree programs with duration and semester information

### Migration File
**File**: `supabase/migrations/20251206000001_add_programs_table.sql`

### What the Migration Does
1. Creates `program_type` enum (undergraduate, postgraduate, diploma, certificate, phd)
2. Creates `programs` table with fields:
   - code, name, short_name
   - department_id (foreign key)
   - program_type
   - duration_years (e.g., 3 for BCA, 4 for B.Tech)
   - total_semesters (e.g., 6 for 3-year, 8 for 4-year)
   - eligibility, total_seats
3. Adds `program_id` column to `students` table
4. Inserts 8 sample programs:
   - BCA (3 years, 6 semesters)
   - MCA (2 years, 4 semesters)
   - BBA (3 years, 6 semesters)
   - MBA (2 years, 4 semesters)
   - B.Com (3 years, 6 semesters)
   - B.Sc CS (3 years, 6 semesters)
   - B.Tech CS (4 years, 8 semesters)
   - M.Tech CS (2 years, 4 semesters)
5. Sets up RLS policies (viewable by all, manageable by admins)

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
- ✅ `app/(admin)/users/students/create.tsx` - Updated to use programs
  - Changed `Course` interface to `Program`
  - Changed `courses` state to `programs`
  - Changed `course_id` to `program_id` throughout
  - Updated form labels (Course → Program)
  - Updated validation messages

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

### Step 1: Apply Programs Migration
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
3. Select Department → See programs filter automatically
4. Select Program → See years filter based on program duration
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

### Programs Table
- [ ] Migration applied successfully
- [ ] `programs` table visible in Supabase Table Editor
- [ ] 8 programs inserted (BCA, MCA, MBA, etc.)
- [ ] `students` table has `program_id` column
- [ ] Student creation form loads without errors
- [ ] Department selection filters programs correctly
- [ ] Program selection filters years correctly

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

### Issue: Migration fails - programs table already exists
```sql
-- Run this first to clean up:
DROP TABLE IF EXISTS programs CASCADE;
DROP TYPE IF EXISTS program_type CASCADE;
-- Then run the migration again
```

### Issue: Admin user creation fails - users already exist
```sql
-- Run this to delete old users:
DELETE FROM auth.users WHERE email LIKE '%@college.com';
-- Then run the script again
```

### Issue: Student creation fails - program_id constraint
Make sure the migration was applied before creating students.

### Issue: Can't see programs in dropdown
Check that:
1. Migration was applied
2. Programs were inserted
3. Departments exist and match the department codes in the INSERT statements

---

## Files Modified

### New Files
1. `supabase/migrations/20251206000001_add_programs_table.sql` - Programs table migration
2. `scripts/create-verified-admin-users.sql` - Verified admin users SQL
3. `ADMIN_CREDENTIALS.md` - Credentials reference
4. `SETUP_INSTRUCTIONS.md` - This file

### Modified Files
1. `app/(admin)/users/students/create.tsx` - Updated to use programs
   - Changed interfaces, state variables, form fields
   - Updated validation and submission logic
   - Changed UI labels (Course → Program)

---

## Next Steps

After setup is complete:

1. **Add More Programs**: Use Supabase dashboard or SQL to add department-specific programs
2. **Test Student Registration**: Create test students in different programs
3. **Test Role-Based Access**: Validate each admin role's permissions
4. **Customize Programs**: Update program details (eligibility, seats, etc.)
5. **Production Ready**: System is ready for real user testing

---

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Verify TypeScript compiles: `npx tsc --noEmit`
3. Check browser console for runtime errors
4. Verify database state in Table Editor
