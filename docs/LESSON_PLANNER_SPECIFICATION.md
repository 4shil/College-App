# Lesson Planner System Specification

**Date:** 2026-01-08  
**System:** College App Teacher Module - Lesson Planner  
**Purpose:** Weekly topic planning and syllabus progress tracking

**Note:** This is distinct from the Faculty Work Diary (6-Unit System). The Lesson Planner is about **what will be taught**, not **workload quantification**.

---

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Data Structure](#data-structure)
4. [Workflow](#workflow)
5. [Approval Process](#approval-process)
6. [Database Schema](#database-schema)
7. [UI Components](#ui-components)
8. [Implementation Guide](#implementation-guide)

---

## Overview

### Purpose
The Lesson Planner allows teachers to:
1. **Plan weekly lessons** for each course/section they teach
2. **Define topics and learning objectives** for each day
3. **Track syllabus completion** by marking topics as completed
4. **Submit plans for HOD approval** before teaching
5. **Maintain academic records** of what was taught when

### Key Distinction from Work Diary
| Lesson Planner | Work Diary |
|----------------|------------|
| Weekly planning cycle | Monthly recording cycle |
| Topic-focused (what to teach) | Workload-focused (hours spent) |
| Forward-looking (planning) | Backward-looking (recording) |
| Per course/section | All activities combined |
| Approved before teaching | Approved after completion |

---

## Core Concepts

### 1. Weekly Planning Cycle
- Teachers plan **one week at a time** (typically Monday-Saturday)
- Each planner covers a specific course and section
- Planning happens **before the week begins** (ideally weekend before)

### 2. Daily Topics Structure
Each day in the week has:
- **Day number** (1-7, typically 1=Monday, 6=Saturday)
- **Topic/Chapter** to be covered
- **Learning objectives** (optional but recommended)
- **Teaching methods** (lecture, practical, discussion, etc.)
- **Resources needed** (textbooks, equipment, etc.)
- **Completion status** (marked after teaching)

### 3. Syllabus Tracking
- Planners are linked to **course syllabi**
- Topics map to **syllabus units/modules**
- System tracks **percentage completion**
- Alerts when behind schedule

### 4. Approval Hierarchy
- **Draft** → Teacher creates and edits
- **Submitted** → Teacher submits for approval
- **Approved** → HOD approves (ready to teach)
- **Rejected** → HOD rejects with reason (teacher must revise)

---

## Data Structure

### Main Table: `lesson_planners`

```typescript
interface LessonPlanner {
  id: UUID;
  teacher_id: UUID;           // Teacher creating the plan
  course_id: UUID;            // Which course
  section_id: UUID | null;    // Which section (optional)
  academic_year_id: UUID;     // Academic year
  semester_id: UUID | null;   // Semester (optional)
  
  // Week definition
  week_start_date: Date;      // Monday (or week start)
  week_end_date: Date;        // Saturday (or week end)
  week_number: number;        // ISO week number
  
  // Planning data
  planned_topics: PlannedTopic[];     // JSONB array
  completed_topics: CompletedTopic[]; // JSONB array
  
  // Metadata
  total_periods_planned: number;      // Expected teaching hours
  total_periods_completed: number;    // Actual teaching hours
  syllabus_coverage_percentage: number; // 0-100
  
  // Approval workflow
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at: Date | null;
  approved_by: UUID | null;   // HOD who approved
  approved_at: Date | null;
  rejection_reason: string | null;
  
  // Audit
  created_at: Date;
  updated_at: Date;
}

interface PlannedTopic {
  day: number;                // 1-7 (day of week)
  date: string;               // YYYY-MM-DD
  period_number: number;      // 1, 2, 3, etc.
  topic: string;              // "Introduction to Data Structures"
  subtopics: string[];        // ["Arrays", "Linked Lists"]
  learning_objectives: string[]; // ["Understand array indexing", ...]
  teaching_method: 'lecture' | 'practical' | 'tutorial' | 'discussion' | 'seminar';
  resources_required: string[]; // ["Textbook Ch. 3", "Projector", "Lab access"]
  syllabus_unit: string | null; // "Unit 2 - Data Structures"
  estimated_duration: number; // Minutes
  notes: string | null;       // Teacher's private notes
}

interface CompletedTopic {
  day: number;
  date: string;
  period_number: number;
  topic: string;
  completed_at: Date;
  actual_duration: number;    // Minutes
  completion_notes: string | null; // "Students struggled with pointers"
  assessment_done: boolean;   // Did you assess understanding?
  homework_assigned: string | null;
}
```

---

## Workflow

### Phase 1: Planning (Draft)

```
Teacher opens planner screen
  ↓
Select course & section
  ↓
Select week (start date)
  ↓
System generates 6-7 day template
  ↓
Teacher fills topics for each day
  ↓
Add learning objectives & resources
  ↓
Save as draft
```

### Phase 2: Submission

```
Teacher reviews draft
  ↓
Clicks "Submit for Approval"
  ↓
System validates completeness
  ↓
Status changes to "submitted"
  ↓
HOD receives notification
```

### Phase 3: Approval

```
HOD views pending planners
  ↓
Reviews topics & objectives
  ↓
Checks syllabus alignment
  ↓
EITHER: Approve → status = "approved"
     OR: Reject → status = "rejected" + reason
  ↓
Teacher receives notification
```

### Phase 4: Execution & Completion

```
Week begins (Monday)
  ↓
Teacher teaches from approved plan
  ↓
After each class:
  - Mark topic as completed
  - Add completion notes
  - Record actual duration
  ↓
End of week:
  - System calculates completion %
  - Updates syllabus progress
```

---

## Approval Process

### Teacher → HOD Approval

| State | Teacher Can | HOD Can |
|-------|------------|---------|
| **draft** | Edit, Delete, Submit | - |
| **submitted** | View only | Approve, Reject |
| **approved** | View, Mark completed | View |
| **rejected** | View reason, Edit, Resubmit | - |

### Validation Rules

Before submission, system checks:
- [ ] At least 3 topics planned for the week
- [ ] All mandatory fields filled (topic, day, teaching method)
- [ ] Week dates are in the future or current week
- [ ] No duplicate planner exists for same course/section/week
- [ ] Course is active and assigned to teacher

### Rejection Handling

When HOD rejects:
1. Status → `rejected`
2. Rejection reason stored
3. Teacher can:
   - View reason
   - Edit the plan
   - Resubmit (status → `submitted` again)

---

## Database Schema

### Enhanced `lesson_planners` Table

```sql
CREATE TABLE lesson_planners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    
    -- Week definition
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    week_number INTEGER,
    
    -- Planning data (JSONB)
    planned_topics JSONB NOT NULL DEFAULT '[]',
    completed_topics JSONB DEFAULT '[]',
    
    -- Metrics
    total_periods_planned INTEGER DEFAULT 0,
    total_periods_completed INTEGER DEFAULT 0,
    syllabus_coverage_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (syllabus_coverage_percentage >= 0 AND syllabus_coverage_percentage <= 100),
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(teacher_id, course_id, section_id, week_start_date)
);

CREATE INDEX idx_lesson_planners_teacher ON lesson_planners(teacher_id);
CREATE INDEX idx_lesson_planners_course ON lesson_planners(course_id);
CREATE INDEX idx_lesson_planners_status ON lesson_planners(status);
CREATE INDEX idx_lesson_planners_week ON lesson_planners(week_start_date, week_end_date);
```

### Supporting Tables

```sql
-- Syllabus units for tracking coverage
CREATE TABLE syllabus_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    unit_name VARCHAR(200) NOT NULL,
    topics JSONB DEFAULT '[]',  -- Array of topic names
    estimated_hours INTEGER,
    is_mandatory BOOLEAN DEFAULT true,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, unit_number)
);

-- Planner audit log
CREATE TABLE lesson_planner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planner_id UUID NOT NULL REFERENCES lesson_planners(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'created', 'drafted', 'submitted', 'approved', 'rejected',
        'topics_added', 'topics_edited', 'topics_completed', 'resubmitted'
    )),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changes_summary TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planner_audit_planner ON lesson_planner_audit_log(planner_id);
CREATE INDEX idx_planner_audit_user ON lesson_planner_audit_log(changed_by);
```

---

## UI Components

### 1. Planner List Screen

```
┌────────────────────────────────────────────────┐
│ Lesson Planners                   [+ Create]   │
├────────────────────────────────────────────────┤
│                                                │
│ [Filter: All | Draft | Submitted | Approved]   │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ CS101 - Data Structures                  │  │
│ │ Week: Jan 13-19, 2026       [Draft]      │  │
│ │ Topics: 5 | Completed: 0/5               │  │
│ │                         [Edit] [Submit]   │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ CS102 - Algorithms                       │  │
│ │ Week: Jan 6-12, 2026     [Approved ✓]   │  │
│ │ Topics: 6 | Completed: 4/6               │  │
│ │                   [View] [Mark Complete] │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ CS103 - Database Systems                 │  │
│ │ Week: Dec 30-Jan 5       [Rejected ✗]   │  │
│ │ Reason: "More detail needed"             │  │
│ │                         [Edit] [Resubmit]│  │
│ └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### 2. Create/Edit Planner Screen

```
┌────────────────────────────────────────────────┐
│ ← Create Weekly Planner                        │
├────────────────────────────────────────────────┤
│                                                │
│ Course: [CS101 - Data Structures ▼]           │
│ Section: [Section A ▼]                         │
│ Week: [Jan 13, 2026 ▼] to Jan 19, 2026        │
│                                                │
│ ─────────────────────────────────────────────  │
│ DAY 1: Monday, Jan 13                          │
│ ─────────────────────────────────────────────  │
│                                                │
│ Period 1 (09:00-10:00)                         │
│ Topic: [Introduction to Arrays____________]    │
│ Syllabus Unit: [Unit 2 - Data Structures ▼]   │
│ Method: [🎤 Lecture ▼]                         │
│                                                │
│ Learning Objectives:                           │
│ • [Understand array memory layout_______]      │
│ • [Learn array operations_______________]      │
│ [+ Add Objective]                              │
│                                                │
│ Resources: [Textbook Ch. 3, Whiteboard____]    │
│ Notes: [Review basic pointers first_______]    │
│                                                │
│ [+ Add Another Period for Monday]              │
│                                                │
│ ─────────────────────────────────────────────  │
│ DAY 2: Tuesday, Jan 14                         │
│ ─────────────────────────────────────────────  │
│ [+ Add Period]                                 │
│                                                │
│ [Continue for remaining days...]               │
│                                                │
│ ══════════════════════════════════════════════ │
│ Summary: 5 periods planned                     │
│ Syllabus coverage: Unit 2 (30%)                │
│                                                │
│ [Save Draft] [Submit for Approval]             │
└────────────────────────────────────────────────┘
```

### 3. Mark Completion Screen

```
┌────────────────────────────────────────────────┐
│ ← Mark Topics Completed                        │
│ CS101 - Week of Jan 6-12, 2026                 │
├────────────────────────────────────────────────┤
│                                                │
│ Monday, Jan 6 - Period 1                       │
│ Topic: Introduction to Arrays                  │
│                                                │
│ ☑ Completed                                    │
│ Actual Duration: [60] minutes                  │
│ Notes: [Students engaged well. Need more___]   │
│       [practice with 2D arrays.___________]    │
│                                                │
│ ☐ Assessment Done                              │
│ Homework Assigned: [Exercise 3.1-3.5______]    │
│                                                │
│ [Save]                                         │
│                                                │
│ ─────────────────────────────────────────────  │
│ Tuesday, Jan 7 - Period 2                      │
│ Topic: Linked Lists - Basic Operations        │
│ [Not yet completed]                            │
│                                                │
└────────────────────────────────────────────────┘
```

### 4. HOD Approval Screen

```
┌────────────────────────────────────────────────┐
│ Approve Lesson Planner                         │
│ Teacher: Dr. John Smith                        │
│ Course: CS101 - Data Structures (Section A)    │
│ Week: Jan 13-19, 2026                          │
├────────────────────────────────────────────────┤
│                                                │
│ WEEKLY PLAN SUMMARY:                           │
│ Total Periods: 5                               │
│ Syllabus Units: Unit 2 (Arrays), Unit 3 (...)│
│ Teaching Methods: 3 Lectures, 2 Practicals     │
│                                                │
│ ─────────────────────────────────────────────  │
│ DETAILED PLAN:                                 │
│                                                │
│ Monday - Period 1:                             │
│ ✓ Topic: Introduction to Arrays                │
│ ✓ Objectives: 2 defined                        │
│ ✓ Resources: Listed                            │
│                                                │
│ Tuesday - Period 2:                            │
│ ✓ Topic: Linked Lists Basics                  │
│ ⚠ Objectives: Missing (consider adding)        │
│ ✓ Resources: Listed                            │
│                                                │
│ [View Full Details...]                         │
│                                                │
│ ═══════════════════════════════════════════════│
│ DECISION:                                      │
│                                                │
│ ( ) ✓ APPROVE - Ready to teach                │
│ ( ) ✗ REJECT - Needs revision                 │
│                                                │
│ Rejection Reason (if applicable):              │
│ [_________________________________________]    │
│                                                │
│ [Submit Decision]                              │
└────────────────────────────────────────────────┘
```

---

## Implementation Guide

### API Functions

```typescript
// Create new planner
async function createPlanner(data: {
  teacher_id: string;
  course_id: string;
  section_id?: string;
  week_start_date: string;
  planned_topics: PlannedTopic[];
}) {
  // Calculate week_end_date (+6 days)
  // Set status = 'draft'
  // Insert into lesson_planners
}

// Submit for approval
async function submitPlanner(planner_id: string) {
  // Validate completeness
  // Update status = 'submitted'
  // Set submitted_at = now
  // Log to audit
  // Notify HOD
}

// HOD approve
async function approvePlanner(planner_id: string, hod_user_id: string) {
  // Check HOD has permission
  // Update status = 'approved'
  // Set approved_by, approved_at
  // Log to audit
  // Notify teacher
}

// HOD reject
async function rejectPlanner(planner_id: string, hod_user_id: string, reason: string) {
  // Check HOD has permission
  // Update status = 'rejected'
  // Set rejection_reason
  // Log to audit
  // Notify teacher
}

// Mark topic completed
async function markTopicCompleted(planner_id: string, day: number, period: number, notes: string) {
  // Find planned_topic by day + period
  // Move to completed_topics array
  // Update total_periods_completed
  // Recalculate syllabus_coverage_percentage
}
```

### RLS Policies

```sql
-- Teachers can create/edit their own draft planners
CREATE POLICY "Teachers manage own draft planners" ON lesson_planners
  FOR ALL
  TO authenticated
  USING (
    teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
    AND status IN ('draft', 'rejected')
  );

-- Teachers can view their own planners
CREATE POLICY "Teachers view own planners" ON lesson_planners
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- HOD can view department planners
CREATE POLICY "HOD views department planners" ON lesson_planners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN departments d ON t.department_id = d.id
      WHERE t.id = lesson_planners.teacher_id
      AND d.hod_user_id = auth.uid()
    )
  );

-- HOD can approve/reject submitted planners
CREATE POLICY "HOD approves department planners" ON lesson_planners
  FOR UPDATE
  TO authenticated
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM teachers t
      JOIN departments d ON t.department_id = d.id
      WHERE t.id = lesson_planners.teacher_id
      AND d.hod_user_id = auth.uid()
    )
  );
```

---

## Testing Checklist

### Unit Tests
- [ ] Create planner with valid data
- [ ] Validate week_end_date calculation
- [ ] Prevent duplicate planner for same course/week
- [ ] Validate planned_topics structure
- [ ] Calculate total_periods_planned correctly

### Integration Tests
- [ ] Teacher creates draft planner
- [ ] Teacher submits planner (status → submitted)
- [ ] HOD approves planner (status → approved)
- [ ] HOD rejects planner (status → rejected, reason stored)
- [ ] Teacher edits rejected planner and resubmits
- [ ] Mark topics as completed
- [ ] Calculate syllabus coverage percentage

### E2E Tests
- [ ] Full workflow: create → submit → approve → mark complete
- [ ] Rejection workflow: create → submit → reject → edit → resubmit → approve
- [ ] RLS enforcement: Teacher A cannot view Teacher B's planners
- [ ] HOD can only approve planners from their department

---

**Status:** Ready for Implementation  
**Last Updated:** 2026-01-08  
**Version:** 1.0
