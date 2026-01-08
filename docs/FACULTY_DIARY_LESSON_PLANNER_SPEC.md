# Faculty Work Diary System Specification
**Complete Breakdown of the 6-Unit Workload Tracking System**

**Date:** 2026-01-08  
**System:** College App Teacher Module - Work Diary  
**Purpose:** Digitize the teacher's faculty diary workload tracking with quantifiable dimension metrics across 6 units

**Note:** This document covers the **Faculty Work Diary** ONLY. The Lesson Planner is a separate system for weekly topic planning.

---

## Table of Contents
1. [Overview](#overview)
2. [Core Unit System](#core-unit-system)
3. [Data Entry Logic & Coding System](#data-entry-logic--coding-system)
4. [Grid Layout Architecture](#grid-layout-architecture)
5. [Special Blocking Logic](#special-blocking-logic)
6. [Monthly Approval Workflow](#monthly-approval-workflow)
7. [Database Schema](#database-schema)
8. [Implementation Checklist](#implementation-checklist)
9. [UI/UX Component Specifications](#uiux-component-specifications)

---

## Overview

This system is designed to track a teacher's **complete monthly workload quantifiably across six specific dimensions** ("Units") rather than just listing activities. The Faculty Work Diary captures:

- **Teaching Duties** (Time-table based) → Unit I only (classroom teaching hours)
- **Academic & Administrative Duties** (Task-based) → Units II–VI (all other work)

### Key Principle
The Work Diary is a **monthly record** where teachers document EVERY working activity they perform. Every entry must fall into exactly ONE of six units. The system provides automated summaries and enforces a strict approval hierarchy (Teacher → HOD → Principal).

### What This Replaces
In traditional paper diaries, teachers manually fill grids with:
- Class periods taught (Unit I)
- Non-teaching hours (Units II–VI)
- Holiday/Leave status
Then submit for HOD and Principal signatures.

This digital system **automates the calculations**, enforces **data validation**, and creates **immutable audit trails**.

---

## Core Unit System

### The 6 Units Explained

| Unit | Name | Type | Tracked By | Examples |
|------|------|------|------------|----------|
| **I** | Lecture/Practical (L/P) | Time-table based | Class Period (time slot) | Teaching in classroom, lab sessions |
| **II** | Tutorial (TI) | Task-based | Hours (0–5) | Student supervision, fieldwork, project guidance, internal exams |
| **III** | Examination (Ex) | Task-based | Hours (0–5) | Setting question papers, invigilation, evaluating answer scripts |
| **IV** | Research (Re) | Task-based | Hours (0–5) | Personal research, consultancy, guiding research scholars |
| **V** | Preparation (Pr) | Task-based | Hours (0–5) | Lesson planning, library referencing, creating audio-visual aids |
| **VI** | Extension (Et) | Task-based | Hours (0–5) | Administrative work, extra-curricular activities, student monitoring |

### Critical Distinction
- **Unit I (L/P):** The ONLY unit tracked via the timetable. Mapped to actual class periods.
- **Units II–VI:** Free-form task tracking. Teacher manually enters 0–5 hours per day.

---

## Data Entry Logic & Coding System

### A. Class Codes (For Unit I — Lecture/Practical Only)

Teachers use **shorthand codes** to fit complex data into timetable grid cells:

#### Degree Program Codes
```
D_{semester_number} = Degree (Undergraduate) Semester
Examples:
  D_1 = B.Sc Semester 1 (Year 1, 1st Half)
  D_2 = B.Sc Semester 2 (Year 1, 2nd Half)
  D_3 = B.Sc Semester 3 (Year 2, 1st Half)
  D_4 = B.Sc Semester 4 (Year 2, 2nd Half)
  D_5 = B.Sc Semester 5 (Year 3, 1st Half)
  D_6 = B.Sc Semester 6 (Year 3, 2nd Half)
```

#### Master's Program Codes
```
M_{semester_number} = Master's (Postgraduate) Semester
Examples:
  M_1 = M.Sc Semester 1 (Year 1, 1st Half)
  M_2 = M.Sc Semester 2 (Year 1, 2nd Half)
  M_3 = M.Sc Semester 3 (Year 2, 1st Half)
  M_4 = M.Sc Semester 4 (Year 2, 2nd Half)
```

#### Mapping to Data
The app translates these codes to:
- **D_3** → Fetch course/section/semester data for the Degree program (Semester 3)
- **M_2** → Fetch course/section/semester data for the Master's program (Semester 2)

### B. Attendance Status Codes

Teachers mark the nature of each day:

| Code | Meaning | Data Impact |
|------|---------|------------|
| **W** | Working Day | All cells (timetable + tasks) are enabled for entry |
| **H** | Holiday | Entire row is blocked. Holiday name recorded in Remarks |
| **L** | Leave | Entire row is blocked. Leave reason recorded in Remarks |

#### Remarks Field
Used for contextual information:
- Holiday name: "Onam Holidays", "Gandhi Jayanthi"
- Leave reason: "Rain Leave", "Medical Leave", "Casual Leave"
- Any special notes

---

## Grid Layout Architecture

### The Daily Log Matrix

The lesson planner/diary is organized as a **time-vs-task matrix**. Each row represents one day. Columns capture:

#### Column Groups

```
┌─────────────────────────────────────────────────────────────────────┐
│  DATE & DAY  │      UNIT I - LECTURE/PRACTICAL      │ UNITS II-VI │
│              │   (Timetable-based — 5-hour day)     │  (Task hrs) │
├─────────────────────────────────────────────────────────────────────┤
│ Date │ Day   │ Spl │ P1  │ P2  │ P3  │ P4  │ P5  │ Spl │ PG  │ UG │
│      │ (Mon) │ AM  │     │     │     │     │     │ EVE │ Cnt │Cnt │
├─────────────────────────────────────────────────────────────────────┤
│ 1/8  │ Mon   │ -   │ D_1 │ M_2 │ D_3 │ D_1 │ -   │ -   │ 1   │ 3  │
│      │       │     │     │     │     │     │     │     │     │    │
├─────────────────────────────────────────────────────────────────────┤
│         │ UNIT II │ UNIT III │ UNIT IV │ UNIT V  │ UNIT VI │ REMARKS
│         │Tutorial │ Exam hrs │ Research│ Prep hrs│ Extend  │
│         │ Hours   │          │ Hours   │         │ Hours   │
├─────────────────────────────────────────────────────────────────────┤
│ ....... │ TI      │ Ex       │ Re      │ Pr      │ Et      │ ...
│ ....... │  (0-5)  │ (0-5)    │ (0-5)   │ (0-5)   │ (0-5)   │ text
└─────────────────────────────────────────────────────────────────────┘
```

### Column Descriptions

#### LEFT: Date & Day (Anchor)
- Date field (YYYY-MM-DD or similar)
- Day of week (Mon, Tue, etc.)
- Used for sorting and filtering

#### MIDDLE-LEFT: Timetable (Unit I)
- **Spl Class (AM):** Early morning special class (optional)
- **Periods I–V:** Standard 5-period teaching day
  - Each cell holds a class code: `D_x`, `M_x`, or blank (no class)
- **Spl Class (EVE):** After-hours extra class (optional)

#### MIDDLE-RIGHT: Daily Summaries (Auto-calculated)
- **Total PG:** Count of how many Master's classes (M_x codes) appear in Periods I–V + Special slots
- **Total UG:** Count of how many Degree classes (D_x codes) appear in Periods I–V + Special slots

**Example:**
If a day has: `D_1, M_3, D_1, empty, empty` → **Total PG = 1, Total UG = 2**

#### RIGHT: Non-Teaching Tasks (Units II–VI)
- **Unit II (TI):** Tutorial/supervision hours (stepper input: 0–5)
- **Unit III (Ex):** Examination hours (stepper input: 0–5)
- **Unit IV (Re):** Research hours (stepper input: 0–5)
- **Unit V (Pr):** Preparation hours (stepper input: 0–5)
- **Unit VI (Et):** Extension hours (stepper input: 0–5)

#### FAR RIGHT: Remarks
- Text field for special notes
- Holiday name, leave reason, or additional context

---

## Special Blocking Logic

### Holiday Blocking

When a major holiday occurs (e.g., "Onam Holidays" spanning September 15–22):

1. **Physical representation:** In the paper diary, these rows are merged with the holiday name written across them.
2. **Digital equivalent:**
   - Mark the day as **"H"** (Holiday)
   - Enter the holiday name in the Remarks field
   - **Lock the entire row:** All cells (timetable + task inputs) become read-only or visually disabled
   - System prevents accidental data entry

#### UI Behavior for Holiday
```
Day: Mon, 15-Sep         Status: HOLIDAY        Remarks: Onam Holidays
┌──────────────────────────────────────────────────────────────┐
│ [LOCKED - Holiday row]                                       │
│ No timetable entry    │ No task entry          │ No edit      │
└──────────────────────────────────────────────────────────────┘
```

### Leave Blocking

When a teacher is on leave (e.g., "Rain Leave" for specific dates):

1. **Physical representation:** Row merged with leave reason across it.
2. **Digital equivalent:**
   - Mark the day as **"L"** (Leave)
   - Enter the leave reason in the Remarks field
   - **Lock the entire row:** All cells become read-only
   - System prevents accidental data entry

#### UI Behavior for Leave
```
Day: Wed, 08-Oct         Status: LEAVE          Remarks: Rain Leave
┌──────────────────────────────────────────────────────────────┐
│ [LOCKED - Leave row]                                         │
│ No timetable entry    │ No task entry          │ No edit      │
└──────────────────────────────────────────────────────────────┘
```

### Working Day Unlock

When a day is marked as **"W"** (Working Day):
- All cells (timetable periods, task hours, remarks) are **editable**
- Data entry is permitted
- Teacher can save changes to the diary

---

## Monthly Approval Workflow

### Strict Validation Hierarchy

At the **end of each month**, the teacher performs manual summation and submits to a three-step approval chain.

#### Step 1: Teacher Summary & Signature

Teacher manually fills:

| Metric | Description | Value |
|--------|-------------|-------|
| **Days on DL/OD** | Duty Leave / Official Duty days | Integer |
| **Days on Other Leave** | Casual Leave, Medical Leave, etc. | Integer |
| **Total Days Present** | Working days (W status days) | Integer |

Teacher then **signs digitally** or marks complete, certifying:
> "I verify that the data entered above is accurate and complete for this month."

#### Step 2: HOD (Head of Department) Approval

HOD reviews the submitted diary and:
- ✅ **Approves** (status → `hod_approved`) → proceeds to Principal
- ❌ **Rejects** (status → `rejected`, stores rejection reason) → returns to Teacher for correction

HOD signs/marks approval in the system.

#### Step 3: Principal Final Validation

Principal reviews the HOD-approved diary and:
- ✅ **Approves** (status → `principal_approved`) → diary is finalized
- ❌ **Rejects** (status → `rejected`, stores rejection reason) → returns to Teacher for correction

Principal signs/marks approval in the system.

### Rejection & Resubmission Flow

If rejected at any stage:
1. Rejection reason is displayed to the teacher
2. Teacher can edit the diary (status reverts to `draft`)
3. Teacher corrects data and resubmits
4. Approval cycle restarts from Step 1

### Data Model for Approvals

```
work_diaries table:
  status: 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected'
  submitted_at: TIMESTAMPTZ (when teacher submits)
  hod_approved_by: UUID (HOD's profile ID)
  hod_approved_at: TIMESTAMPTZ
  principal_approved_by: UUID (Principal's profile ID)
  principal_approved_at: TIMESTAMPTZ
  rejection_reason: TEXT (if rejected at any stage)
```

---

## Database Schema

### Current Tables

#### `lesson_planners`
```sql
CREATE TABLE lesson_planners (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL,           -- Teacher who created it
    course_id UUID NOT NULL,             -- Course being taught
    section_id UUID,                     -- Section (optional)
    academic_year_id UUID NOT NULL,     -- Academic year
    week_start_date DATE NOT NULL,      -- Monday of week
    week_end_date DATE NOT NULL,        -- Friday/Saturday of week
    planned_topics JSONB NOT NULL,      -- [{day: 1, topic: "...", objectives: "..."}]
    completed_topics JSONB,             -- [{day: 1, topic: "...", completed: true}]
    status VARCHAR(20),                 -- 'draft' | 'submitted' | 'approved' | 'rejected'
    submitted_at TIMESTAMPTZ,
    approved_by UUID,                   -- Admin/HOD who approved
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### `work_diaries`
```sql
CREATE TABLE work_diaries (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL,           -- Teacher who created it
    academic_year_id UUID NOT NULL,     -- Academic year
    month INTEGER (1-12),               -- Month
    year INTEGER,                       -- Calendar year
    daily_entries JSONB NOT NULL,       -- [{
                                        --   date: "2024-01-01",
                                        --   status: 'W'|'H'|'L',
                                        --   remarks: "...",
                                        --   periods: [{
                                        --     slot: "P1"|"P2"|"AM"|"EVE",
                                        --     class_code: "D_1"|"M_2"|null
                                        --   }],
                                        --   tasks: {
                                        --     unit_ii_hours: 0,
                                        --     unit_iii_hours: 0,
                                        --     unit_iv_hours: 0,
                                        --     unit_v_hours: 0,
                                        --     unit_vi_hours: 0
                                        --   }
                                        -- }]
    status VARCHAR(20),                 -- 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected'
    submitted_at TIMESTAMPTZ,
    hod_approved_by UUID,
    hod_approved_at TIMESTAMPTZ,
    principal_approved_by UUID,
    principal_approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(teacher_id, month, year)
);
```

### Proposed Schema Enhancements for 6-Unit System

```sql
-- Monthly summary table (auto-calculated)
CREATE TABLE work_diary_summaries (
    id UUID PRIMARY KEY,
    work_diary_id UUID NOT NULL REFERENCES work_diaries(id),
    month_start_date DATE,
    month_end_date DATE,
    
    -- Attendance summary
    days_on_duty_leave INTEGER DEFAULT 0,
    days_on_other_leave INTEGER DEFAULT 0,
    total_days_present INTEGER DEFAULT 0,
    
    -- Unit I summary (auto-calculated from periods)
    unit_i_pg_count INTEGER DEFAULT 0,      -- Total Master's classes
    unit_i_ug_count INTEGER DEFAULT 0,      -- Total Degree classes
    
    -- Units II-VI summary (auto-summed from daily_entries)
    unit_ii_total_hours DECIMAL(5, 2),     -- Total tutorial hours
    unit_iii_total_hours DECIMAL(5, 2),    -- Total exam hours
    unit_iv_total_hours DECIMAL(5, 2),     -- Total research hours
    unit_v_total_hours DECIMAL(5, 2),      -- Total prep hours
    unit_vi_total_hours DECIMAL(5, 2),     -- Total extension hours
    
    -- Approval chain
    teacher_approved_at TIMESTAMPTZ,
    hod_approved_at TIMESTAMPTZ,
    principal_approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail for approval changes
CREATE TABLE work_diary_audit_log (
    id UUID PRIMARY KEY,
    work_diary_id UUID NOT NULL REFERENCES work_diaries(id),
    changed_by UUID NOT NULL REFERENCES profiles(id),
    change_type VARCHAR(50),  -- 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected' | 'edited'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    reason TEXT,              -- For rejections
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Checklist

### Phase 1: Core Data Structure
- [ ] Create `work_diary_summaries` table for monthly summaries
- [ ] Create `work_diary_audit_log` table for approval audit trails
- [ ] Migrate `work_diaries.daily_entries` to include status, class_code, and task hours
- [ ] Define RLS policies for teacher/HOD/principal access
- [ ] Create database functions for auto-calculating summaries

### Phase 2: Teacher UI (Data Entry)
- [ ] Create daily log view with date + day columns
- [ ] Build timetable grid (Periods I–V + AM/EVE special)
  - [ ] Class code selector dropdown (D_1 to D_6, M_1 to M_4)
  - [ ] Clear/delete cell ability
- [ ] Build task hours section (Units II–VI)
  - [ ] Stepper inputs (0–5 hours) for each unit
  - [ ] Real-time validation (max 5 hours per unit)
- [ ] Implement status selector (W / H / L)
- [ ] Add remarks text field
- [ ] Auto-calculate "Total PG" and "Total UG" display
- [ ] Implement save/draft functionality

### Phase 3: Blocking Logic
- [ ] When status = "H" (Holiday), disable all input cells and show "Holiday" badge
- [ ] When status = "L" (Leave), disable all input cells and show "Leave" badge
- [ ] When status = "W" (Working Day), enable all input cells
- [ ] Visual styling to distinguish locked vs. unlocked rows

### Phase 4: Monthly Summary & Approval Flow
- [ ] Create summary calculation screen
  - [ ] Manual input fields for DL/OD, Other Leave, Total Days Present
  - [ ] Auto-calculated summaries for Units I–VI from daily entries
  - [ ] Teacher review + mark complete
- [ ] Implement HOD approval view
  - [ ] Display teacher's submitted diary
  - [ ] Approve / Reject buttons
  - [ ] Rejection reason text field
- [ ] Implement Principal approval view (same as HOD, final step)
- [ ] Create rejection handling UI (re-edit button, rejection reason display)

### Phase 5: Reporting & Analytics
- [ ] Monthly workload report (units per month)
- [ ] Semester workload trend
- [ ] Per-unit hours summary
- [ ] Export to PDF (diary + approval chain)

---

## UI/UX Component Specifications

### 1. Daily Entry Form

```
┌─────────────────────────────────────────────────────────┐
│ WORK DIARY - Daily Entry                      [SAVE]    │
├─────────────────────────────────────────────────────────┤
│
│ Date:         [2026-01-08]       Day: [Monday]
│ Status:       [W ▼]  (W=Work, H=Holiday, L=Leave)
│ Remarks:      [Enter holiday name or leave reason...]
│
├─────────────────────────────────────────────────────────┤
│ UNIT I - LECTURE/PRACTICAL (Timetable)
│
│ Spl AM:  [D_1 ▼] [✕]
│ Period I: [M_2 ▼] [✕]
│ Period II: [    ▼] [✕]
│ Period III: [D_3 ▼] [✕]
│ Period IV: [    ▼] [✕]
│ Period V: [    ▼] [✕]
│ Spl EVE: [    ▼] [✕]
│
│ Summary: Total PG: [1]   Total UG: [2]
│
├─────────────────────────────────────────────────────────┤
│ UNITS II-VI - NON-TEACHING TASKS (Hours)
│
│ Unit II - Tutorial:        [0] [+] [-] (0/5 hours)
│ Unit III - Examination:    [0] [+] [-] (0/5 hours)
│ Unit IV - Research:        [0] [+] [-] (0/5 hours)
│ Unit V - Preparation:      [0] [+] [-] (0/5 hours)
│ Unit VI - Extension:       [0] [+] [-] (0/5 hours)
│
├─────────────────────────────────────────────────────────┤
│                        [SAVE] [CANCEL]
└─────────────────────────────────────────────────────────┘
```

### 2. Holiday/Leave Blocking Example

```
┌─────────────────────────────────────────────────────────┐
│ Date: 2026-01-15  Day: Thursday   Status: [H] (HOLIDAY) │
├─────────────────────────────────────────────────────────┤
│
│ ⚠️  HOLIDAY - Entry Locked
│
│ Remarks: Onam Holidays
│
│ [All input cells disabled - visual overlay]
│
│                        [EDIT] [CANCEL]
└─────────────────────────────────────────────────────────┘
```

### 3. Monthly Summary & Approval Screen

```
┌──────────────────────────────────────────────────────────┐
│ WORK DIARY - Monthly Summary & Approval                  │
│ Month: January 2026                                      │
├──────────────────────────────────────────────────────────┤
│
│ ATTENDANCE SUMMARY (Enter manually):
│ Days on Duty Leave / OD:     [____]
│ Days on Other Leave:          [____]
│ Total Days Present:           [____] (auto-calculated)
│
├──────────────────────────────────────────────────────────┤
│ WORKLOAD BY UNIT (Auto-calculated):
│
│ Unit I (L/P):
│   PG Classes:  15
│   UG Classes:  42
│
│ Unit II (Tutorial):    120 hours (avg 4.3 hrs/day)
│ Unit III (Exam):       24 hours  (avg 0.9 hrs/day)
│ Unit IV (Research):    8 hours   (avg 0.3 hrs/day)
│ Unit V (Preparation):  45 hours  (avg 1.6 hrs/day)
│ Unit VI (Extension):   12 hours  (avg 0.4 hrs/day)
│
├──────────────────────────────────────────────────────────┤
│ APPROVAL STATUS:
│
│ Teacher Status:        [READY FOR SUBMISSION]
│ Signature:            [✓ Signed by Ashil Raj]  Signed at 2026-01-31 18:00
│ 
│ HOD Status:           [PENDING HOD APPROVAL]
│ Principal Status:     [PENDING APPROVAL]
│
│ NOTE: Once submitted, only HOD can approve or reject.
│
├──────────────────────────────────────────────────────────┤
│                  [SUBMIT FOR APPROVAL] [DRAFT]
└──────────────────────────────────────────────────────────┘
```

### 4. HOD Approval View

```
┌──────────────────────────────────────────────────────────┐
│ WORK DIARY - HOD APPROVAL                                │
│ Teacher: Ashil Raj | Month: January 2026                 │
├──────────────────────────────────────────────────────────┤
│
│ [Display entire monthly summary + daily entries]
│
│ Teacher's Signature:  ✓ Ashil Raj (2026-01-31)
│
├──────────────────────────────────────────────────────────┤
│ DECISION:
│
│ ( ) ✓ APPROVE - Proceed to Principal
│ ( ) ✕ REJECT  - Return to teacher with reason
│
│ Rejection Reason (if applicable):
│ [Text field for HOD to enter reason]
│
│ Your Signature:       [Sign]
│
├──────────────────────────────────────────────────────────┤
│                    [APPROVE] [REJECT] [CANCEL]
└──────────────────────────────────────────────────────────┘
```

### 5. Principal Approval View

```
┌──────────────────────────────────────────────────────────┐
│ WORK DIARY - PRINCIPAL APPROVAL (FINAL)                  │
│ Teacher: Ashil Raj | Month: January 2026                 │
├──────────────────────────────────────────────────────────┤
│
│ [Display entire monthly summary + HOD approval]
│
│ Teacher's Signature:  ✓ Ashil Raj (2026-01-31)
│ HOD Approval:         ✓ Dr. Sharma (2026-02-01)
│
├──────────────────────────────────────────────────────────┤
│ FINAL DECISION:
│
│ ( ) ✓ APPROVE - Diary finalized
│ ( ) ✕ REJECT  - Return to teacher with reason
│
│ Rejection Reason (if applicable):
│ [Text field for Principal to enter reason]
│
│ Your Signature:       [Sign]
│
├──────────────────────────────────────────────────────────┤
│                    [APPROVE] [REJECT] [CANCEL]
└──────────────────────────────────────────────────────────┘
```

### 6. Monthly Calendar View (Overview)

```
┌──────────────────────────────────────────────────────────┐
│ WORK DIARY - January 2026 Calendar Overview              │
├──────────────────────────────────────────────────────────┤
│
│ Sun   Mon   Tue   Wed   Thu   Fri   Sat
│                              1     2     3
│  4     5     6     7     8     9     10
│        W     W     W     W     W           (5 days worked)
│        PG:2  PG:1  PG:2  PG:3  PG:1       (Unit I sample)
│        UG:4  UG:3  UG:4  UG:5  UG:2
│
│  11    12    13    14    15    16    17
│  W     W     H     L     W     W           (Fri 15=Holiday)
│  PG:1  PG:2  [Holiday] [Rain] PG:1  PG:2
│  UG:3  UG:4           Leave    UG:4  UG:3
│
│  [Month continues...]
│
│ SUMMARY:
│ Working Days: 22 | Holidays: 3 | Leaves: 2
│ Total PG Classes: 45 | Total UG Classes: 95
│ Avg Unit II hrs/day: 4.2 | Avg Unit III hrs/day: 0.8
│
├──────────────────────────────────────────────────────────┤
│  STATUS: Draft  [EDIT] [SUBMIT FOR APPROVAL]
└──────────────────────────────────────────────────────────┘
```

---

## Key Implementation Considerations

### 1. Automation
- **Total PG/UG:** Auto-calculate by counting D_x and M_x codes in daily timetable
- **Monthly Summaries:** Auto-sum task hours from daily entries
- **Attendance Counts:** Auto-track from day status (W/H/L)

### 2. Validation Rules
- Task hours (Units II–VI): Must be 0–5 per day
- Class codes: Must be valid D_1 to D_6 or M_1 to M_4
- Holiday/Leave: Must be marked before blocking takes effect
- Monthly approval: Cannot be submitted until all days in month are completed

### 3. Security (RLS Policies)
- Teachers can only create/edit their own diaries in `draft` status
- HOD can only approve/reject diaries for their department
- Principal can approve/reject any diary in the college
- Audit log tracks all changes by user + timestamp

### 4. UI/UX Best Practices
- **Calendar view** for quick monthly overview
- **Color coding:** Working day (white), Holiday (red), Leave (orange), Submitted (blue)
- **Disabled row styling** for Holiday/Leave (grayed out, slight opacity)
- **Inline error messages** if validation fails (e.g., "Task hours cannot exceed 5")
- **Confirmation dialogs** for destructive actions (delete day, reject diary)

---

## Future Enhancements

1. **Workload Analysis Dashboard:** Visualize unit-wise workload trends over semesters
2. **Comparative Reports:** Compare teacher workload distribution across departments
3. **Auto-Blocking:** System detects holidays from college calendar and auto-blocks days
4. **Offline Sync:** Offline data entry with sync when online
5. **Mobile Optimization:** Responsive design for tablet/mobile entry during class
6. **Notifications:** Real-time alerts for approval status changes
7. **Export Formats:** PDF, CSV, Excel for archival and analysis

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** Complete Specification Ready for Implementation
