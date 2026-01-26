# Proposed App Changes - January 2026

**Created:** January 25, 2026  
**Status:** Planning Phase - Do Not Implement Yet

---

## Overview

This document outlines proposed changes to the JPM College App. These changes are in the planning phase and require review before implementation.

---

## Change Request 1: Receptionist Attendance View

### 1.1 Feature Description

Enable the **Receptionist (reception_admin)** role to view attendance records for all students across the college. This allows the reception desk to:

- Quickly verify if a student was present/absent when parents inquire
- Monitor daily attendance patterns
- Identify students with attendance concerns
- Support gate pass decisions based on attendance history

### 1.2 Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| View all attendance records | Must Have | Read-only access |
| Sort by status (absents first) | Must Have | Absents at top, then presents |
| Filter by date | Must Have | Single day or date range |
| Filter by department/class | Should Have | Narrow down results |
| Search by student name/roll | Should Have | Quick lookup |
| Export to CSV/PDF | Nice to Have | For reports |

### 1.3 User Stories

```
As a Receptionist,
I want to view all attendance records for today,
So that I can answer parent inquiries about student presence.

As a Receptionist,
I want to see absent students listed first,
So that I can quickly identify who is missing today.

As a Receptionist,
I want to filter attendance by department,
So that I can focus on specific sections.

As a Receptionist,
I want to search for a specific student,
So that I can quickly check their attendance status.
```

### 1.4 Technical Implementation Plan

#### 1.4.1 Database Changes

**New Permission:**
```sql
-- Add new permission for reception attendance view
INSERT INTO public.role_permissions_matrix (role_id, permission_key, enabled)
SELECT r.id, 'reception_view_all_attendance', true
FROM public.roles r
WHERE r.name = 'reception_admin';
```

**New RLS Policy:**
```sql
-- Allow reception_admin to view attendance
CREATE POLICY "Reception can view all attendance"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'reception_admin'
    AND ur.is_active = true
  )
);

-- Same for attendance_records
CREATE POLICY "Reception can view all attendance records"
ON public.attendance_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'reception_admin'
    AND ur.is_active = true
  )
);
```

**New RPC Function:**
```sql
CREATE OR REPLACE FUNCTION get_attendance_for_reception(
  p_date DATE DEFAULT CURRENT_DATE,
  p_department_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL -- 'present', 'absent', 'late', or NULL for all
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  roll_number TEXT,
  department_name TEXT,
  section_name TEXT,
  year INT,
  period INT,
  status TEXT,
  marked_at TIMESTAMPTZ,
  marked_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is reception_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'reception_admin'
    AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    s.roll_number,
    d.name AS department_name,
    sec.name AS section_name,
    s.year,
    a.period,
    ar.status,
    a.created_at AS marked_at,
    p.full_name AS marked_by_name
  FROM public.attendance_records ar
  JOIN public.attendance a ON ar.attendance_id = a.id
  JOIN public.students s ON ar.student_id = s.id
  LEFT JOIN public.departments d ON s.department_id = d.id
  LEFT JOIN public.sections sec ON a.section_id = sec.id
  LEFT JOIN public.profiles p ON a.marked_by = p.id
  WHERE a.date = p_date
  AND (p_department_id IS NULL OR s.department_id = p_department_id)
  AND (p_status IS NULL OR ar.status = p_status)
  ORDER BY 
    CASE ar.status 
      WHEN 'absent' THEN 1 
      WHEN 'late' THEN 2 
      ELSE 3 
    END,
    d.name,
    s.year,
    s.roll_number;
END;
$$;
```

#### 1.4.2 Frontend Changes

**New File: `app/(admin)/reception/attendance.tsx`**

UI Components:
- Date picker (default: today)
- Department filter dropdown
- Status filter tabs: All | Absent | Present | Late
- Sortable table with columns:
  - Student Name
  - Roll Number
  - Department
  - Year/Section
  - Period
  - Status (color-coded badge)
  - Marked By
  - Time
- Search input for name/roll number
- Refresh button
- Export button (optional)

**Wire-frame:**
```
┌─────────────────────────────────────────────────────────┐
│  📋 Attendance Overview                     [⟳] [📥]    │
├─────────────────────────────────────────────────────────┤
│  Date: [📅 Jan 25, 2026 ▼]    Dept: [All Departments ▼]│
├─────────────────────────────────────────────────────────┤
│  [🔍 Search student...]                                 │
├─────────────────────────────────────────────────────────┤
│  [All] [Absent 23] [Present 145] [Late 12]              │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 Rahul Sharma      │ CSE-A │ 3rd Year │ Absent  │ │
│  │    Roll: CS2021034   │ P1-P6 │ All day  │         │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 🔴 Priya Singh       │ ECE-B │ 2nd Year │ Absent  │ │
│  │    Roll: EC2022015   │ P3-P4 │ 2 periods│         │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 🟡 Amit Kumar        │ CSE-B │ 1st Year │ Late    │ │
│  │    Roll: CS2023042   │ P1    │ 15 mins  │         │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 🟢 Sneha Patel       │ IT-A  │ 2nd Year │ Present │ │
│  │    Roll: IT2022008   │ P1-P6 │ All day  │         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**RBAC Updates in `lib/rbac.ts`:**
```typescript
// Add new permission
'reception_view_all_attendance': [ROLES.RECEPTION_ADMIN],

// Add to MODULE_ACCESS
reception: [ROLES.RECEPTION_ADMIN, ROLES.SUPER_ADMIN],
```

#### 1.4.3 Navigation Updates

Add to `app/(admin)/reception/index.tsx`:
```typescript
{
  title: 'Attendance Overview',
  icon: 'calendar-check',
  route: '/(admin)/reception/attendance',
  description: 'View all student attendance',
}
```

### 1.5 Security Considerations

| Aspect | Mitigation |
|--------|------------|
| Data exposure | Read-only access, no edit capability |
| Scope creep | Only attendance data, not grades or personal info |
| Audit trail | Log all receptionist queries |
| Time restriction | Consider limiting to current semester only |

### 1.6 Testing Checklist

- [ ] Receptionist can access the attendance page
- [ ] Non-receptionist roles cannot access the page
- [ ] Absent students appear first in the list
- [ ] Date filter works correctly
- [ ] Department filter narrows results
- [ ] Search finds students by name and roll number
- [ ] Status tabs filter correctly
- [ ] Empty state shows when no records
- [ ] Loading state displays during fetch
- [ ] Error handling works for API failures
- [ ] RLS prevents direct table access bypass

---

## Change Request 2: Privacy Enhancements (Quick Wins)

### 2.1 SecureStore Migration

**Current State:** Auth tokens in unencrypted AsyncStorage  
**Target State:** Auth tokens in `expo-secure-store`

**Files to modify:**
- `lib/supabase.ts` - Update storage adapter
- `package.json` - Add `expo-secure-store` dependency

### 2.2 Privacy Policy Display

**New Files:**
- `app/(auth)/privacy-policy.tsx` - Full policy view
- `components/legal/PrivacyPolicyModal.tsx` - Modal version

**Registration Flow Update:**
- Add checkbox: "I have read and agree to the Privacy Policy"
- Link to full policy
- Block registration if not checked

### 2.3 Profile Photo Privacy

**Current State:** `avatars` and `hall_ticket_photos` buckets are public  
**Target State:** Authenticated read access only

**Migration Required:**
```sql
-- Update bucket policies
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('avatars', 'hall_ticket_photos');

-- Add authenticated read policy
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

---

## Change Request 3: UI/UX Improvements

### 3.1 Loading States

Add skeleton loaders to:
- Dashboard cards
- Attendance list
- Student profile sections

### 3.2 Error Boundaries

Ensure all route groups have error boundaries (already done in previous session).

### 3.3 Offline Indicators

Show banner when offline (already implemented in `lib/networkUtils.ts`).

---

## Implementation Priority

| Change | Priority | Effort | Dependencies |
|--------|----------|--------|--------------|
| Receptionist Attendance View | High | 3 days | None |
| SecureStore Migration | Critical | 2 days | expo-secure-store |
| Privacy Policy | Critical | 1 day | Legal review |
| Photo Privacy | High | 0.5 day | None |
| UI Improvements | Medium | 2 days | None |

---

## Approval Checklist

- [ ] Product Owner review
- [ ] Security team review (for privacy changes)
- [ ] Legal review (for privacy policy)
- [ ] UX review (for receptionist UI)
- [ ] Database admin review (for RLS changes)

---

## Notes

- **Do not implement** until all approvals are received
- Migration scripts need testing in staging environment
- Consider rollback plan for RLS policy changes
- Mobile app update required for SecureStore migration

---

*Document created: January 25, 2026*  
*Last updated: January 25, 2026*
