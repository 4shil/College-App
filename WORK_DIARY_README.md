# Faculty Work Diary - 6-Unit System

**Status:** Ready to apply
**Date:** 2026-01-08

This replaces the lesson-planner focus. Use this for the monthly Faculty Work Diary (Units I–VI).

---

## What to run

1) Open Supabase Dashboard → SQL Editor
2) Paste + run [`APPLY_WORK_DIARY_MIGRATION.sql`](APPLY_WORK_DIARY_MIGRATION.sql)
3) Re-run tests:
```bash
node test-work-diary.js
```

Expected (after applying): tables and RPC exist; anon inserts are blocked by RLS.

---

## Key Tables
- `work_diaries` (already exists)
- `work_diary_summaries` (monthly rollups)
- `work_diary_daily_entries` (normalized daily grid)
- `class_code_mappings` (D_x / M_x codes)
- `work_diary_audit_log` (status/audit)

## Key Function
- `approve_work_diary(p_diary_id UUID, p_decision TEXT, p_reason TEXT default null)` (from prior approvals migration)
- `calculate_class_totals` (helper for PG/UG counts)
- `calculate_monthly_summary` (helper for rollups)

---

## RLS expectations
- Anon cannot insert into `work_diaries`.
- Owners can read their own diary-related rows; HOD can read via department; principal via role/permission.

---

## UI impact
- Teacher diary screens already exist under `app/(teacher)/diary/*`.
- Admin/HOD review screens exist under `app/(admin)/planner-diary/*` (use the Diary tab).

---

## Troubleshooting
- Missing tables/functions → rerun `APPLY_WORK_DIARY_MIGRATION.sql` in SQL Editor.
- RLS errors → ensure user is authenticated and has a teacher profile.
