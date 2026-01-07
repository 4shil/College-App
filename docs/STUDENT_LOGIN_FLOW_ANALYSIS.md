# Student login flow analysis (JPM College App)

Date: 2026-01-07

This document explains how the **Student authentication + routing + authorization** works in the current codebase, including login, registration, OTP verification, password reset, and how the app decides which module (Student/Teacher/Admin) a user should land in.

---

## 1) High-level flow (what happens when the app opens)

### 1.1 App bootstrap route

The app boots through the root route and immediately decides where to go:

- Entry: [app/index.tsx](../app/index.tsx)
- Steps:
  1. Reads the persisted Supabase session with `supabase.auth.getSession()`.
  2. If no session → routes to `/(auth)/login`.
  3. If session exists → calls `getAuthUser(userId)`.
  4. Stores session + resolved user metadata into `useAuthStore`.
  5. Routes to the correct dashboard:
     - If roles contain `hod` → `/(teacher)/dashboard` (special case)
     - Else if teacher → `/(teacher)/dashboard`
     - Else if admin → `/(admin)/dashboard`
     - Else → `/(student)/dashboard`

This means the app is **role-driven at boot**, not just “whoever logged in last”.

### 1.2 Route guarding (segment-based redirects)

There is also a hook-based guard that enforces module access based on the current route group:

- Guard: [hooks/useAuth.ts](../hooks/useAuth.ts)
- Behavior (high level):
  - Rehydrates session, listens to `supabase.auth.onAuthStateChange`.
  - Fetches profile + roles into the auth store.
  - Redirects users away from route groups they don’t belong to (e.g., non-students away from `/(student)`), and sends unauthenticated users back to `/(auth)`.

Even though boot routing already sends users to the “right” dashboard, this guard is important as a second line of defense when users deep-link into screens or when state changes.

### 1.3 Why this matters for students

- A student user only reaches the Student module if:
  - Supabase session exists AND
  - `getAuthUser()` classifies them as student (roles include `student` OR fallback finds a row in `students`).

---

## 2) Student login screen (email + password)

### 2.1 Where it is implemented

- Screen: [app/(auth)/login.tsx](../app/%28auth%29/login.tsx)
- Backend auth: `signInWithEmail()` from [lib/supabase.ts](../lib/supabase.ts)
- App user lookup: `getAuthUser()` from [lib/database.ts](../lib/database.ts)
- Session + profile storage: [store/authStore.ts](../store/authStore.ts)

### 2.2 Key feature: “Student vs Staff” login mode

The UI has a **2-option role selector**:
- `student`
- `staff` (Teachers + Admins)

After a successful Supabase password sign-in, the app fetches `authUser = getAuthUser(userId)` and checks:
- `isStudent = !authUser.isTeacher && !authUser.isAdmin`
- `isStaff = authUser.isTeacher || authUser.isAdmin`

Then it blocks incorrect usage:
- If user selects Student login but account is staff → error message
- If user selects Staff login but account is student → error message

This prevents “wrong portal” logins (a common UX problem in multi-role systems).

### 2.3 Navigation after login

After passing the mode restriction:
- Teacher → `/(teacher)/dashboard`
- Admin → `/(admin)/dashboard`
- Student → `/(student)/dashboard`

### 2.4 Edge case: Supabase user exists but profile/roles are missing

In login.tsx, if `getAuthUser()` returns null:
- If selected role is `student`: it still sets session and routes to `/(student)/dashboard`.
- If selected role is `staff`: shows an error (“No staff account found…”).

**Important consequence:**
- Student module screens typically rely on student DB rows and RLS policies.
- If there is no `profiles`/`students` row, some student screens will show “Student profile not found” states.

---

## 3) How the app decides “is this user a student?”

### 3.1 getAuthUser(userId)

Implemented in: [lib/database.ts](../lib/database.ts)

Resolution logic:
1. Fetches the profile from `profiles`.
2. Fetches active roles from `user_roles → roles`.
3. Computes:
   - `isAdmin` by role name set
   - `isTeacher` by role name set (includes `hod`)
   - `isStudent` if role list includes `student`
4. Fallback checks:
   - If not teacher by roles, queries `teachers` table for `user_id`.
   - If not student by roles, queries `students` table for `user_id`.

**Feature:** this fallback avoids misrouting when roles are temporarily misconfigured.

### 3.2 Store representation

- `useAuthStore` tracks `profile`, `roles`, and booleans (`isAdmin`, `isTeacher`, `isStudent`).
- That store is set either by:
  - login flow calling `setSession()` + `setAuthUser()`, or
  - boot flow in [app/index.tsx](../app/index.tsx).

---

## 4) Student module access control (RBAC gates)

### 4.1 Route-level protection

The Student stack is wrapped with `Restricted roles={['student']}`:

- Wrapper component: [components/Restricted.tsx](../components/Restricted.tsx)
- Student layout: [app/(student)/_layout.tsx](../app/%28student%29/_layout.tsx)

### 4.2 Where the role check comes from

`Restricted` uses `useRBAC()` which fetches roles from:
- `public.user_roles` joined to `public.roles` (active rows)

Implementation: [hooks/useRBAC.ts](../hooks/useRBAC.ts)

**Practical requirement for students:**
- A student must have a `user_roles` entry for the `student` role.
- Registration creates it automatically (see section 5).

If a user is routed to student dashboard via fallback (students table row exists) but has **no** `user_roles` record:
- `Restricted` will likely deny access (because RBAC role list will be empty).

---

## 5) Student registration flow (APAAR + OTP)

This is how a new student creates an account inside the app.

### 5.1 Screens involved

- Registration form (multi-step): [app/(auth)/register.tsx](../app/%28auth%29/register.tsx)
- OTP verification: [app/(auth)/verify-otp.tsx](../app/%28auth%29/verify-otp.tsx)

### 5.2 Step-by-step flow

#### Step A — APAAR eligibility verification
- Register calls: `supabase.rpc('verify_apaar_id', { p_apaar_id })`
- DB source of truth: `allowed_students` table
- Outcome:
  - If APAAR doesn’t exist or is already used → block registration.
  - If valid → proceed.

#### Step B — Collect personal + academic details
- Fetches programmes from `courses` table (`program_type` not null).
- Collects: name, email, phone, DOB, father name, gender, programme, year, semester, roll number, admission no.

#### Step C — Store registration payload in DB (server-side)
- Register stores the payload via:
  - `supabase.rpc('generate_otp', { p_email, p_purpose: 'registration', p_registration_data })`
- This inserts a row into `otp_verifications` with the registration JSON.

#### Step D — Send OTP using Supabase Auth
- Register sends OTP via `sendOTP(email)` which calls:
  - `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true }})`

#### Step E — Verify OTP + finalize student record
In [app/(auth)/verify-otp.tsx](../app/%28auth%29/verify-otp.tsx):
1. Verifies OTP with `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
2. Sets the user password with `supabase.auth.updateUser({ password })`.
3. Reads the stored registration JSON from `otp_verifications`.
4. Calls `supabase.rpc('complete_student_registration', { p_user_id, p_apaar_id, p_registration_data })`.
5. Marks otp_verifications row as verified.
6. Redirects back to login.

### 5.3 Database objects involved

Defined in migrations:
- allowed_students + OTP/registration functions: [supabase/migrations/20251130000001_student_registration.sql](../supabase/migrations/20251130000001_student_registration.sql)
- Updated registration to use `courses` as programmes: [supabase/migrations/20251230000001_fix_student_registration_programme.sql](../supabase/migrations/20251230000001_fix_student_registration_programme.sql)

Key tables:
- `auth.users` (Supabase Auth)
- `profiles`
- `students`
- `roles`
- `user_roles`
- `allowed_students`
- `otp_verifications`

Key functions:
- `verify_apaar_id(p_apaar_id)`
- `generate_otp(p_email, p_purpose, p_registration_data)`
- `complete_student_registration(p_user_id, p_apaar_id, p_registration_data)`

### 5.4 Important feature: role assignment

`complete_student_registration()` assigns the `student` role in `user_roles`.
That’s what makes Student module RBAC gates pass.

---

## 6) Forgot password flow (email OTP)

Implemented in: [app/(auth)/forgot-password.tsx](../app/%28auth%29/forgot-password.tsx)

Flow:
1. User enters email.
2. App sends OTP via `sendOTP(email)` (Supabase email OTP).
3. App verifies OTP with `verifyOTP(email, code)`.
4. App updates password with `updateUserPassword(newPassword)`.
5. User returns to login.

Notes:
- This flow is **pure auth** (password reset). It doesn’t modify `students`/`profiles`.

---

## 7) What features become available after student login

Once a student is authenticated *and* has the `student` role (or at least a valid student row), the Student module surfaces features backed by Supabase tables, including:

- Dashboard summary (timetable today, attendance snapshot, marks preview)
- Attendance (attendance_records / attendance headers)
- Timetable + substitutions (timetable_entries / substitutions)
- Teaching materials (teaching_materials)
- Assignments + submissions (assignments / assignment_submissions)
- Notices + read tracking (notices / notice_reads)
- Events + certificates (events / event_certificates)
- Library browse + issues (books / book_issues)
- Canteen menu + token history (canteen_daily_menu / canteen_tokens)
- Bus transport request flow (bus_routes / bus_stops / bus_subscriptions)
- Fees & receipts (student_fees / fee_payments)
- Feedback + complaints (feedback / complaints)
- Honors/minor registration (minor_subjects / student_minor_registrations)

All of these depend on **RLS policies** allowing students to read only what they should.

---

## 8) RLS / permissions expectations (what must be true in the DB)

At minimum, students need:
- Read access to their own `students` record and related rows
- Read access to their own `user_roles` (so RBAC can resolve `student`)
- Read/write access for “own-scope” tables (submissions, notice_reads, etc.)

On 2026-01-07, an additional migration was added to cover missing policies for student-used tables:
- Student module missing RLS: [supabase/migrations/20260107000001_student_module_missing_rls.sql](../supabase/migrations/20260107000001_student_module_missing_rls.sql)

Storage buckets used by the app are created in:
- [supabase/migrations/20260103000003_app_storage_buckets.sql](../supabase/migrations/20260103000003_app_storage_buckets.sql)

---

## 9) Common failure modes and what they mean

- **Login succeeds but student screens show “Student profile not found”**
  - Likely missing `students` row for this user.
  - Fix: ensure registration completed or admin created/linked student record.

- **Student gets routed to student dashboard but RBAC blocks (blank screen / denied)**
  - Likely missing `user_roles` row with role `student`.
  - Fix: insert `user_roles` with role `student` (department_id optional depending on policies).

- **Some lists always empty even though data exists**
  - Usually an RLS policy gap on the queried table.
  - Fix: add a SELECT policy for authenticated users / student-owned records.

- **OTP verify works but registration doesn’t finalize**
  - `complete_student_registration` RPC failed (often programme mismatch).
  - Ensure you’re on the updated function that uses `courses` as programme source.

---

## 10) Summary

- Student login is **Supabase email/password** + **role-aware routing**.
- Students are gated into the student module via RBAC (`Restricted` + `useRBAC`), so the `student` role assignment is critical.
- Registration is a **4-step flow** with APAAR eligibility, OTP verification, then an RPC to create the `students` record + assign `user_roles`.
- Many student features rely on RLS. Missing policies usually appear as “empty lists”.
