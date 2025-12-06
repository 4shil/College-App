# Admin User Credentials - VERIFIED & READY

All emails are verified. Use these credentials to login to the admin dashboard.

## Verified Admin Accounts

| Role | Email | Password | Name |
|------|-------|----------|------|
| **Super Admin** | superadmin@college.com | Super@2024 | Robert Johnson |
| **Principal** | principal@college.com | Principal@2024 | Dr. Sarah Williams |
| **Exam Cell Admin** | examadmin@college.com | Exam@2024 | Michael Brown |
| **Library Admin** | librarian@college.com | Library@2024 | Emily Davis |
| **Finance Admin** | financeadmin@college.com | Finance@2024 | David Martinez |
| **HOD** | hod@college.com | HOD@2024 | Prof. James Wilson |
| **Department Admin** | deptadmin@college.com | DeptAdmin@2024 | Lisa Anderson |
| **Bus Admin** | busadmin@college.com | Bus@2024 | Christopher Lee |
| **Canteen Admin** | canteenadmin@college.com | Canteen@2024 | Jessica Taylor |

## How to Setup

1. Open Supabase Dashboard for your project
2. Go to SQL Editor
3. Run the SQL in `scripts/create-verified-admin-users.sql`
4. This will:
   - Delete all old unverified test users
   - Create 9 new verified admin users with confirmed email addresses
   - Create user profiles
   - Assign admin roles

## After Setup

You can now login with any of the above credentials. The emails are marked as verified in the database, so:
- ✅ No email verification needed
- ✅ Can login immediately
- ✅ All roles assigned correctly
- ✅ Can test each admin role's UI and permissions

## Testing Each Role

1. **Super Admin** (superadmin@college.com)
   - Should see: 5 tabs (Dashboard, Users, Notices, Modules, Settings)
   - Should see: Full dashboard with all stats
   - Can access: All modules via Modules tab

2. **Principal** (principal@college.com)
   - Should see: 5 tabs (Dashboard, Users, Notices, Modules, Settings)
   - Can access: User management, notices, attendance reports

3. **Module-Specific Admins** (Exam, Library, Finance, Bus, Canteen)
   - Should see: 3 tabs (Dashboard, Modules, Settings)
   - Should see: Welcome card on dashboard
   - Can access: Only their specific module

4. **HOD** (hod@college.com)
   - Should see: 4 tabs (Dashboard, Notices, Modules, Settings)
   - Can manage: Department attendance, notices, approvals

5. **Department Admin** (deptadmin@college.com)
   - Should see: 4 tabs (Dashboard, Users, Notices, Settings)
   - Can manage: Department users and notices only
