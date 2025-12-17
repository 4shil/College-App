# 🔴 DATABASE ISSUES REPORT

**VERIFIED BY:** Querying actual Supabase database  
**DATE:** December 17, 2025  
**METHOD:** Ran test queries against live database to verify table and column existence

## Overview

This document identifies **10 critical issues** found by analyzing the actual Supabase database schema against code usage. All issues have been verified by running queries against the live database.

---

## 🔴 CRITICAL ISSUES - MISSING TABLES (5)

### 1. **`batches` Table Does Not Exist**

**Severity:** 🔴 CRITICAL  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/academic/batches/index.tsx` (lines 92, 202, 205, 241)

**Problem:**
```typescript
supabase.from('batches').select(...)
```
**Database says:** `Could not find the table 'public.batches' in the schema cache`

**Impact:** Entire Batches management page is non-functional. Page will crash on load.

**SQL Fix:**
```sql
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    department_id UUID REFERENCES departments(id),
    year_id UUID REFERENCES years(id),
    section_id UUID REFERENCES sections(id),
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. **`bus_subscriptions` Table Does Not Exist**

**Severity:** 🔴 CRITICAL  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/bus/index.tsx` (lines 45-46)
- `app/(admin)/bus/reports.tsx` (lines 53, 59)
- `app/(admin)/bus/approvals.tsx` (lines 53, 80)

**Problem:**
```typescript
supabase.from('bus_subscriptions').select(...)
```
**Database says:** `Could not find the table 'public.bus_subscriptions' in the schema cache`

**Alternative:** Database has `student_bus_registrations` table instead

**Impact:** All bus management pages fail (index, approvals, reports)

**Fix Options:**
1. **Code fix:** Rename `bus_subscriptions` → `student_bus_registrations` in all files
2. **SQL fix:** Create `bus_subscriptions` as alias/view or separate table

---

### 3. **`library_books` Table Does Not Exist**

**Severity:** 🔴 CRITICAL  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/analytics/index.tsx` (line 182)
- `scripts/test-new-features.js` (line 200)

**Problem:**
```typescript
supabase.from('library_books').select('id', { count: 'exact' })
```
**Database says:** `Could not find the table 'public.library_books' in the schema cache`

**Alternative:** Database has `books` table

**Impact:** Library book count in analytics dashboard shows 0 or errors

**Code Fix:**
```typescript
// Change this:
supabase.from('library_books').select('id', { count: 'exact' })
// To this:
supabase.from('books').select('id', { count: 'exact' })
```

---

### 4. **`parents` Table Does Not Exist**

**Severity:** 🔴 CRITICAL  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/users/students/[id].tsx` (line 107)

**Problem:**
```typescript
.from('parents').select(...)
```
**Database says:** `Could not find the table 'public.parents' in the schema cache`

**Note:** Parent info (father_name, mother_name, parent_phone) exists in `students` table

**Impact:** Student detail page parent section will fail to load

**SQL Fix:**
```sql
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    father_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    father_email VARCHAR(255),
    mother_email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. **`users` Table Does Not Exist**

**Severity:** 🔴 CRITICAL  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/library/reservations.tsx` (line 36)
- `app/(admin)/library/issue.tsx` (line 39)
- `scripts/test-backend.js` (line 36)

**Problem:**
```typescript
supabase.from('users').select('id, full_name').eq('is_active', true)
```
**Database says:** `Could not find the table 'public.users' in the schema cache`

**Alternative:** Database has `profiles` table

**Impact:** Library reservation and issue pages fail to load user lists

**Code Fix:**
```typescript
// Change this:
supabase.from('users').select('id, full_name').eq('is_active', true)
// To this:
supabase.from('profiles').select('id, full_name').eq('status', 'active')
```

---

## 🟡 COLUMN MISMATCH ISSUES (5)

### 6. **`attendance.status` Column Does Not Exist**

**Severity:** 🟡 HIGH  
**Verified:** ✅ Confirmed by database query

**Location:**
- `app/(admin)/analytics/index.tsx` (line 174-176)

**Problem:**
```typescript
supabase.from('attendance').select('id, status')...
```
**Reality:** `attendance` table has no `status` column. Status is in `attendance_records`.

**Schema:**
- `attendance`: (id, date, period, course_id, section_id, marked_by, marked_at)
- `attendance_records`: (id, attendance_id, student_id, **status**)

**Code Fix:**
```typescript
// Change this:
supabase.from('attendance').select('id, status')
// To this:
supabase.from('attendance_records').select('id, status')
```

---

### 7. **`students.batch_id` Column Does Not Exist**

**Severity:** 🟡 HIGH  
**Verified:** ✅ Confirmed by database query

**Location:**
- `app/(admin)/academic/batches/index.tsx` (line 120)

**Problem:**
```typescript
.from('students').select('id', { count: 'exact' }).eq('batch_id', batch.id)
```

**Impact:** Cannot count students per batch

**SQL Fix:**
```sql
ALTER TABLE students ADD COLUMN batch_id UUID REFERENCES batches(id);
CREATE INDEX idx_students_batch ON students(batch_id);
```

---

### 8. **`exams.date` Column Does Not Exist**

**Severity:** 🟡 HIGH  
**Verified:** ✅ Confirmed by database query

**Location:**
- `app/(admin)/analytics/index.tsx` (line 178)

**Problem:**
```typescript
supabase.from('exams').select('id', { count: 'exact' }).gte('date', ...)
```

**Reality:** `exams` table has `start_date` and `end_date`, not `date`

**Code Fix:**
```typescript
// Change this:
.gte('date', new Date().toISOString())
// To this:
.gte('start_date', new Date().toISOString())
```

---

### 9. **`notices.is_published` Column Does Not Exist**

**Severity:** 🟡 MEDIUM  
**Verified:** ✅ Confirmed by database query

**Location:**
- `app/(admin)/analytics/index.tsx` (line 173)

**Problem:**
```typescript
supabase.from('notices').select('id', { count: 'exact' }).eq('is_published', true)
```

**Reality:** `notices` table has `is_active`, not `is_published`

**Code Fix:**
```typescript
// Change this:
.eq('is_published', true)
// To this:
.eq('is_active', true)
```

---

### 10. **`profiles.is_active` Column Does Not Exist**

**Severity:** 🟡 MEDIUM  
**Verified:** ✅ Confirmed by database query

**Locations:**
- `app/(admin)/library/reservations.tsx` (line 36)
- `app/(admin)/library/issue.tsx` (line 39)

**Problem:**
```typescript
supabase.from('profiles').select('id, full_name').eq('is_active', true)
```

**Reality:** `profiles` table has `status` enum (active/inactive/pending), not boolean `is_active`

**Code Fix:**
```typescript
// Change this:
.eq('is_active', true)
// To this:
.eq('status', 'active')
```

---

## ✅ VERIFIED: THESE ARE OK

**The following were suspected but verified as CORRECT:**

1. ✅ **`assignments.status` exists** - Table has both `status` and `is_active` columns
2. ✅ **`attendance_records.status` exists** - Column correctly stores attendance status
3. ✅ **`books` table exists** - Just need to update references from `library_books`
4. ✅ **`student_bus_registrations` exists** - Alternative to `bus_subscriptions`

---

## 📋 COMPLETE TABLE COMPARISON

**Tables Queried in Code vs Database Reality:**

| Table Name | Exists? | Issues | Status |
|------------|---------|--------|--------|
| `academic_years` | ✅ Yes | None | ✅ OK |
| `assignment_submissions` | ✅ Yes | None | ✅ OK |
| `assignments` | ✅ Yes | None | ✅ OK |
| `attendance` | ✅ Yes | None | ✅ OK |
| `attendance_delegations` | ✅ Yes | None | ✅ OK |
| `attendance_logs` | ✅ Yes | None | ✅ OK |
| `attendance_records` | ✅ Yes | None | ✅ OK |
| `batches` | ❌ No | Missing table | 🔴 CRITICAL |
| `book_issues` | ✅ Yes | None | ✅ OK |
| `book_reservations` | ✅ Yes | None | ✅ OK |
| `books` | ✅ Yes | None | ✅ OK |
| `bus_routes` | ✅ Yes | None | ✅ OK |
| `bus_subscriptions` | ❌ No | Use `student_bus_registrations` | 🔴 CRITICAL |
| `canteen_tokens` | ✅ Yes | None | ✅ OK |
| `courses` | ✅ Yes | None | ✅ OK |
| `departments` | ✅ Yes | None | ✅ OK |
| `exam_marks` | ✅ Yes | None | ✅ OK |
| `exams` | ✅ Yes | None | ✅ OK |
| `external_marks` | ✅ Yes | None | ✅ OK |
| `fee_payments` | ✅ Yes | None | ✅ OK |
| `fee_structures` | ✅ Yes | None | ✅ OK |
| `holidays` | ✅ Yes | None | ✅ OK |
| `library_books` | ❌ No | Use `books` instead | 🔴 CRITICAL |
| `notices` | ✅ Yes | None | ✅ OK |
| `parents` | ❌ No | Missing table | 🔴 CRITICAL |
| `profiles` | ✅ Yes | None | ✅ OK |
| `roles` | ✅ Yes | None | ✅ OK |
| `sections` | ✅ Yes | None | ✅ OK |
| `semesters` | ✅ Yes | None | ✅ OK |
| `student_fees` | ✅ Yes | None | ✅ OK |
| `students` | ✅ Yes | Missing `batch_id` | 🟡 HIGH |
| `subjects` | ✅ Yes | None | ✅ OK |
| `substitutions` | ✅ Yes | None | ✅ OK |
| `teachers` | ✅ Yes | None | ✅ OK |
| `timetable_entries` | ✅ Yes | None | ✅ OK |
| `user_roles` | ✅ Yes | None | ✅ OK |
| `users` | ❌ No | Use `profiles` instead | 🔴 CRITICAL |
| `years` | ✅ Yes | None | ✅ OK |

**Total:** 38 tables queried | 33 exist ✅ | 5 missing ❌

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### 🔴 Priority 1: CRITICAL - Fix Immediately (Breaks Pages)

#### Fix #1: Create Missing Tables Migration
**File:** `supabase/migrations/20251217000001_fix_missing_tables.sql`

```sql
-- ============================================
-- FIX MISSING TABLES - VERIFIED ISSUES
-- Generated: December 17, 2025
-- ============================================

-- 1. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    department_id UUID REFERENCES departments(id),
    year_id UUID REFERENCES years(id),
    section_id UUID REFERENCES sections(id),
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batches_academic_year ON batches(academic_year_id);
CREATE INDEX idx_batches_department ON batches(department_id);

-- 2. Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    father_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    father_email VARCHAR(255),
    mother_email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- 3. Bus Subscriptions Table
CREATE TABLE IF NOT EXISTS bus_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES bus_routes(id),
    stop_id UUID REFERENCES bus_stops(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_bus_subscriptions_student ON bus_subscriptions(student_id);
CREATE INDEX idx_bus_subscriptions_route ON bus_subscriptions(route_id);
CREATE INDEX idx_bus_subscriptions_status ON bus_subscriptions(approval_status);

-- 4. Add batch_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);

-- 5. Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Add basic RLS policies
CREATE POLICY "Admins full access batches" ON batches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p JOIN roles r ON r.name = p.primary_role 
    WHERE p.id = auth.uid() AND r.category = 'admin')
);

CREATE POLICY "Users view own parents" ON parents FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access parents" ON parents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p JOIN roles r ON r.name = p.primary_role 
    WHERE p.id = auth.uid() AND r.category = 'admin')
);

CREATE POLICY "Students view own bus subscription" ON bus_subscriptions FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access bus subscriptions" ON bus_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p JOIN roles r ON r.name = p.primary_role 
    WHERE p.id = auth.uid() AND r.category = 'admin')
);
```

#### Fix #2: Update Code - Wrong Table Names
**Files to update:**

1. **`app/(admin)/analytics/index.tsx`** - Line 182
```typescript
// Change:
supabase.from('library_books').select('id', { count: 'exact' })
// To:
supabase.from('books').select('id', { count: 'exact' })
```

2. **`app/(admin)/library/reservations.tsx`** - Line 36
```typescript
// Change:
supabase.from('users').select('id, full_name').eq('is_active', true)
// To:
supabase.from('profiles').select('id, full_name').eq('status', 'active')
```

3. **`app/(admin)/library/issue.tsx`** - Line 39
```typescript
// Change:
supabase.from('users').select('id, full_name').eq('is_active', true)
// To:
supabase.from('profiles').select('id, full_name').eq('status', 'active')
```

### 🟡 Priority 2: HIGH - Fix Soon (Wrong Columns)

#### Fix #3: Update Analytics Column Names
**File:** `app/(admin)/analytics/index.tsx`

1. **Line 174-176** - Attendance status
```typescript
// Change:
supabase.from('attendance').select('id, status', { count: 'exact' })
// To:
supabase.from('attendance_records').select('id, status', { count: 'exact' })
```

2. **Line 178** - Exam date
```typescript
// Change:
.gte('date', new Date().toISOString())
// To:
.gte('start_date', new Date().toISOString())
```

3. **Line 173** - Notice published
```typescript
// Change:
.eq('is_published', true)
// To:
.eq('is_active', true)
```

---

## 📊 IMPACT ANALYSIS

### Pages Currently Broken:

| Page | Issue | Impact |
|------|-------|--------|
| Admin → Batches | `batches` table missing | 🔴 CRASHES |
| Admin → Bus (all) | `bus_subscriptions` missing | 🔴 CRASHES |
| Admin → Analytics | Multiple column issues | 🟡 WRONG DATA |
| Admin → Library → Issue/Reserve | `users` table, `is_active` column | 🔴 CRASHES |
| Admin → Student Details | `parents` table missing | 🔴 CRASHES |

### Estimated Downtime Impact:
- **5 major admin pages** completely non-functional
- **1 page** (analytics) showing incorrect data
- **Total affected features:** 6 out of ~30 admin features (**20%**)

---

## ✅ VERIFICATION METHOD

All issues verified by:
1. ✅ Running direct queries against Supabase database
2. ✅ Testing table existence with actual Supabase client
3. ✅ Validating column existence through failed queries
4. ✅ Cross-referencing migration files with actual schema

**Test Script:** `scripts/analyze-database-schema.js`  
**Date Verified:** December 17, 2025

---

## 📋 SUMMARY

| Category | Count |
|----------|-------|
| 🔴 Missing Tables | 5 |
| 🟡 Wrong Column Names | 5 |
| **Total Verified Issues** | **10** |

| Severity | Count | Pages Affected |
|----------|-------|----------------|
| 🔴 Critical | 5 | 5 pages broken |
| 🟡 High | 5 | 1 page wrong data |

**Estimated Fix Time:** 1-2 hours  
**Testing Time:** 30 minutes  
**Total Time:** 2-3 hours

---

*Report generated by automated database analysis*  
*Last updated: December 17, 2025*
