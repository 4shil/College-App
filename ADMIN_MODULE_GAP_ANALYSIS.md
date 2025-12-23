# Admin Module — Gaps, Next Steps, and Analysis

**Generated:** 2025-12-23  
**Scope:** Summarizes project “what’s next” and what’s missing specifically in the Admin module, based on the repo’s planning/status documents and the current implemented routes/screens.

---

## 1) Executive Summary

The Admin module has strong coverage for core modules (RBAC, users, academics, attendance, exams, fees, library, bus, canteen, analytics, settings), but there are several **high-impact gaps** versus the 2025 Admin feature specification:

- **Events (external link only) admin UI is now implemented (MVP)**, but there are still spec gaps (certificate upload, poster upload).
- **Planner/Diary monitoring (admin read-only monitoring) exists only as a minimal scaffold** (no filters/analytics/drill-down yet).


These gaps are important because they affect correctness (audit visibility), operational readiness (scheduled backups), and feature completeness (events, planner/diary monitoring).

---

## 2) What’s Done (Admin-related, evidence-based)

Based on repo reports:

- **RBAC core implemented** (roles, permissions, module access): `RBAC_IMPLEMENTATION.md`
- **RBAC protection applied to admin screens** (screen-level gating for multiple modules): `RBAC_PROTECTION_COMPLETE.md`
- **Backend tests passed for 4 admin modules (Exams/Fees/Library/Assignments)**: `BACKEND_TEST_REPORT.md`
- **Multiple admin pages verified “compile and run clean”** (analytics, bus, batches, library pages): `CODE_VERIFICATION_REPORT.md`
- **Realtime analytics features exist** (per docs): `REALTIME_ANALYTICS_BACKUP_FEATURES.md`

Repo route inventory shows the Admin surface is substantial:

- `app/(admin)/academic/`
- `app/(admin)/analytics/`
- `app/(admin)/assignments/`
- `app/(admin)/attendance/`
- `app/(admin)/audit/`
- `app/(admin)/bus/`
- `app/(admin)/canteen/`
- `app/(admin)/college-info.tsx`
- `app/(admin)/dashboard.tsx`
- `app/(admin)/exams/`
- `app/(admin)/fees/`
- `app/(admin)/library/`
- `app/(admin)/notices.tsx`
- `app/(admin)/reception/`
- `app/(admin)/settings/`
- `app/(admin)/users/`
- `app/(admin)/events.tsx` (list)
- `app/(admin)/events-create.tsx` (create)
- `app/(admin)/events-edit.tsx` (edit)
- `app/(admin)/planner-diary.tsx` (monitoring scaffold)

---

## 3) Project-Level “What’s Next” (priorities)

Use `PROJECT_STATUS_NEXT_STEPS.md` as the practical roadmap (it aligns the plan with actual repo delivery).

**P0 (do these first):**
1. Apply required DB migrations/scripts in your target Supabase environment (notably anything marked required).
2. Seed verified admin users in the target environment for real RBAC testing.
3. Run a manual regression pass of key admin flows.

**P1:**
- Align remaining schema↔UI mismatches (Notices often called out).
- Validate RBAC at *action-level* (create/update/delete), not only screen-level.

**P2:**
- Implement scheduled backups (currently described as placeholder).
- Add audit logging coverage where needed (verify triggers/coverage).

---

## 4) Admin Module — Missing / Incomplete Items (Plan vs Implementation)

### 4.1 Events Management (External link only) — MVP IMPLEMENTED (still incomplete)

The plan requires an Admin Events module with:
- Create event
- Poster upload
- External registration link (required)
- Publish/unpublish
- Optional certificate upload

**Evidence (plan):** `PROJECT_PLAN.md` → “Event Management (External Link Only)”.

**Current state:** Implemented an Events MVP:
- List: `app/(admin)/events.tsx`
- Create: `app/(admin)/events-create.tsx`
- Edit + publish toggle: `app/(admin)/events-edit.tsx`

**Plan alignment notes:**
- The plan’s suggested route structure uses `app/(admin)/events/index.tsx` + `events/create.tsx`. The current implementation uses flat routes (`events.tsx`, `events-create.tsx`, `events-edit.tsx`). This is acceptable for Expo Router, but it differs from the plan’s “ideal folder tree”.
- The plan requires **external registration link**; current UI enforces a valid `http/https` link.
- Poster upload and certificate upload are not implemented yet (URL fields only).

**Impact:** Core admin events workflow exists; remaining work is upload flows (poster/certificates) and any role-scoping beyond super_admin.

---

### 4.2 Planner/Diary Monitoring (Admin monitoring only) — PARTIALLY IMPLEMENTED (scaffold)

Plan expects admin monitoring screens (NO approvals):
- Monitor planners status (filters + analytics)
- Monitor diaries status (filters + analytics)

**Evidence (plan):** `PROJECT_PLAN.md` → “Lesson Planner & Work Diary” and admin screen architecture listing `planner-diary/planners.tsx` and `planner-diary/diaries.tsx` as TODO.

**Current state:** A minimal monitoring scaffold exists at `app/(admin)/planner-diary.tsx` (shows recent rows + handles missing tables). Backend-wise, the extended schema migration enables RLS and defines teacher-only policies; to ensure admin monitoring works for admins who are not also teachers, add explicit admin policies (see `supabase/migrations/20251223000000_planner_diary_admin_policies.sql`).

**Verification:** `scripts/test-planner-diary-backend.js` (admin login + SELECT checks)

**Impact:** Still missing most of the plan’s monitoring UX (filters, analytics, drill-down by teacher/department/status).

---

## 5) Analysis (Why these gaps matter + risk assessment)

### 5.1 Product completeness: events + planner/diary monitoring

These are clearly part of the Admin module spec. Missing these leaves major gaps for Principal/Super Admin workflows.

**Recommended fix direction:** implement minimal MVP screens:
- Events: list/create/detail + publish/unpublish + external link validation.
- Planner/Diary monitoring: list with filters + detail preview.

---

## 6) Recommended Next Steps (Admin module, practical order)

### P0 — complete missing admin features
1. Finish Events module to match spec: poster upload + optional certificates upload.
2. Build Planner/Diary monitoring MVP: filters + drill-down screens (read-only, no approvals).

---

## 7) Key File References

- Project next steps: `PROJECT_STATUS_NEXT_STEPS.md`
- Admin spec: `PROJECT_PLAN.md` (Admin module feature specification)

---

## 8) Notes

- The repo contains multiple “COMPLETE” and “ALL TESTS PASSED” reports; these generally reflect reality better than the older “Not Started” sections still present in parts of the plan.
