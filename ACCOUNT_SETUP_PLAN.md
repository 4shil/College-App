# 🔐 JPM College App - Account Setup Plan

## Quick Setup Guide

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `celwfcflcofejjpkpgcq`
3. Navigate to **Authentication** → **Users**

---

## 📋 Test Accounts to Create

### Account 1: Super Admin
| Field | Value |
|-------|-------|
| Email | `admin@jpmcollege.edu` |
| Password | `Admin@123` |
| Role | Super Administrator |
| Access | Full system control |

### Account 2: Teacher
| Field | Value |
|-------|-------|
| Email | `teacher@jpmcollege.edu` |
| Password | `Teacher@123` |
| Role | Subject Teacher |
| Department | CSE |
| Access | Attendance, Marks, Classes |

### Account 3: Student
| Field | Value |
|-------|-------|
| Email | `student@jpmcollege.edu` |
| Password | `Student@123` |
| Role | Student |
| Department | CSE, Year 2, Section A |
| Access | View timetable, attendance, marks |

---

## 🛠️ Setup Instructions

### Method 1: Via Supabase Dashboard (Recommended)

#### Step A: Create Users
1. Go to **Authentication** → **Users** → **Add user**
2. Select **Create new user**
3. Enter email and password for each account
4. Click **Create user**
5. Repeat for all 3 accounts

#### Step B: Run Setup Functions
After creating all 3 users, go to **SQL Editor** and run:

```sql
-- Setup Admin
SELECT setup_test_admin('admin@jpmcollege.edu');

-- Setup Teacher  
SELECT setup_test_teacher('teacher@jpmcollege.edu');

-- Setup Student
SELECT setup_test_student('student@jpmcollege.edu');
```

Each should return: `"[Role] setup complete: [email]"`

---

### Method 2: Via SQL (All at once)

Run this in **SQL Editor**:

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@jpmcollege.edu',
  crypt('Admin@123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', '', ''
);

-- Create teacher user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'teacher@jpmcollege.edu',
  crypt('Teacher@123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', '', ''
);

-- Create student user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'student@jpmcollege.edu',
  crypt('Student@123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', '', ''
);

-- Now setup their profiles and roles
SELECT setup_test_admin('admin@jpmcollege.edu');
SELECT setup_test_teacher('teacher@jpmcollege.edu');
SELECT setup_test_student('student@jpmcollege.edu');
```

---

## ✅ Verification Checklist

After setup, verify in Supabase:

### Check Users Table
```sql
SELECT email, email_confirmed_at FROM auth.users 
WHERE email LIKE '%@jpmcollege.edu';
```
Expected: 3 rows with confirmed emails

### Check Profiles
```sql
SELECT full_name, primary_role, status FROM profiles;
```
Expected:
- Super Administrator | super_admin | active
- Dr. John Smith | subject_teacher | active
- Rahul Kumar | student | active

### Check User Roles
```sql
SELECT u.email, r.name as role, d.name as department
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN departments d ON ur.department_id = d.id;
```

### Check Teacher Record
```sql
SELECT employee_id, designation, teacher_type FROM teachers;
```
Expected: EMP001 | assistant_professor | full_time

### Check Student Record
```sql
SELECT registration_number, roll_number, admission_year FROM students;
```
Expected: JPM2023CSE001 | 23CSE001 | 2023

---

## 🧪 Test Login in App

1. Start the app: `npx expo start --web`
2. Open http://localhost:8081
3. Test each login:

| Role | Email | Password | Expected Redirect |
|------|-------|----------|-------------------|
| Admin | admin@jpmcollege.edu | Admin@123 | /admin/dashboard |
| Teacher | teacher@jpmcollege.edu | Teacher@123 | /teacher/dashboard |
| Student | student@jpmcollege.edu | Student@123 | /student/dashboard |

---

## 🔄 Reset/Recreate Users

If you need to start fresh:

```sql
-- Delete existing test users (careful!)
DELETE FROM students WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@jpmcollege.edu'
);
DELETE FROM teachers WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@jpmcollege.edu'
);
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@jpmcollege.edu'
);
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@jpmcollege.edu'
);
DELETE FROM auth.users WHERE email LIKE '%@jpmcollege.edu';

-- Then recreate using Method 1 or 2 above
```

---

## 📱 Role Permissions Summary

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ❌ | ❌ |
| Manage Courses | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ❌ |
| Enter Marks | ✅ | ✅ | ❌ |
| View Attendance | ✅ | ✅ | ✅ (own) |
| View Marks | ✅ | ✅ | ✅ (own) |
| View Timetable | ✅ | ✅ | ✅ |

---

## 🚀 Next Steps After Setup

1. ✅ Create all 3 test accounts
2. ✅ Run setup functions
3. ✅ Verify data in Supabase
4. ✅ Test login in app
5. ⏳ Build out dashboard features
6. ⏳ Add more test data (more students, teachers)

---

**Created:** November 30, 2025  
**Project:** JPM College App  
**Supabase Project:** celwfcflcofejjpkpgcq
