# Teacher Module — UI Upgrades (No Style/Theme Changes)

## Goal
Make the Teacher module feel **professional, modern, and consistent** while keeping the existing design system intact (no theme overhaul, no new visual style language).

## Hard Constraints (Must Follow)
- **No style/theme change**: do not introduce new color palettes, fonts, shadows, or “new look”.
- Use existing theme tokens via `useThemeStore()` and existing UI primitives in `components/ui` (e.g., `Card`, `PrimaryButton`, `LoadingIndicator`, `GlassInput`, `AnimatedBackground`).
- Keep UX **within existing screens/routes** (avoid adding new pages, new complex flows, or new “feature screens”).
- Prefer small, high-impact UI/UX refinements: layout polish, consistency, microcopy, loading/error states, accessibility.

## Current Baseline (What’s Already Good)
- Strong Teacher shell: bottom dock navigation and clear module grouping.
- Consistent use of `AnimatedBackground`, `Card`, and “header + subtitle” patterns on several screens.
- Good empty states in multiple modules (Assignments, Materials, Timetable, Notices).
- Teacher Dashboard already feels premium (hero, tiles, critical alert strip, theme toggle).

## Global UI Upgrades (Apply Across Teacher Module)
These upgrades are designed to improve perceived quality without changing the style.

### 1) Consistent Screen Header Pattern
Standardize headers across all Teacher screens:
- Left: back button (only on nested/detail/create screens)
- Middle: title + subtitle (1 line each)
- Right: primary action (FAB icon button OR `PrimaryButton` small/outline — pick one pattern per module)

**Acceptance:** every Teacher screen has a predictable header layout and spacing.

### 2) Loading, Empty, and Error States (3-State Completeness)
Ensure every data screen cleanly supports:
- **Loading**: use `LoadingIndicator` + short contextual text (already used in many screens)
- **Empty**: `Card` with a short explanation + next action (CTA)
- **Error**: `Card` message + `PrimaryButton` “Retry” (avoid console-only failures)

**Acceptance:** no teacher list screen fails silently; users always see “what happened” and “what to do”.

### 3) Interaction Feedback and Disabled States
- All destructive/committing actions should show a **saving/uploading state** and disable double-taps.
- Use consistent button text while busy:
  - “Saving…” / “Uploading…” / “Loading…”
- Ensure all tap targets are at least ~44px height.

### 4) Typography and Density Consistency (Without Changing Fonts)
Keep the same existing typographic choices but normalize usage:
- Title: 22px (700–800)
- Subtitle: 13px (muted)
- Card title: 15–16px (800)
- Card meta: 12–13px (muted)

**Acceptance:** screens don’t feel “randomly spaced” or “randomly bold”.

### 5) Microcopy Quality (Professional Tone)
Replace vague or inconsistent text with short, specific phrases:
- Prefer: “No assigned courses found. Ask admin to assign timetable.”
- Avoid: “No data” / “Something wrong”
- Keep subtitles action-oriented: “Your assigned periods”, “Create and manage materials”, “Mark today’s attendance”

### 6) Accessibility & Readability
- Ensure long content uses `numberOfLines` + predictable truncation.
- Ensure important status is not color-only: add label text (e.g., “Active/Hidden”, “Today”).
- For lists, align icons, pills, and CTA buttons consistently.

## Screen-by-Screen Upgrade Recommendations

### Teacher Dashboard (`/(teacher)/dashboard`)
Already strong; focus on polish:
- Ensure **sticky alert strip** behavior is correct (currently computed but confirm usage matches intent).
- Tile grid: keep consistent icon circle sizing and label alignment.
- Add a small “Last updated” timestamp near the refresh area (text-only, no new components).

### Modules Hub (`/(teacher)/modules`)
- Maintain the clean grid; improve predictability:
  - Ensure every module card has consistent icon circle + title spacing.
  - Ensure long module titles wrap to 2 lines consistently (already present).
- Empty state: add a single CTA (e.g., “Contact admin”) only if there is an existing action path; otherwise keep informational.

### Timetable (`/(teacher)/timetable`)
- Improve scanability without adding features:
  - Make the “Today” pill more explicit via label text (already “Monday/Tuesday…”; keep and ensure today stands out).
  - Add a small line under the header: “Showing current academic year timetable” (text only).
  - Ensure “Session tools” CTA styling and placement is consistent with other CTAs (same padding, border color token usage).

### Attendance — Today (`/(teacher)/attendance`)
Recommended upgrades:
- Top summary stats: ensure they are presented as a compact row of `Card`/stat blocks with consistent labels.
- Handle special days clearly:
  - Weekend: show a `Card` stating “No classes (Weekend)” (instead of a blank list).
  - Holiday: show “Holiday: <title>” when known.
- Class list rows:
  - Show period + time as leading meta.
  - Add a clear status label: “Not started / In progress / Completed” (text-based).

### Attendance — Mark (`/(teacher)/attendance/mark`)
This is a high-frequency workflow; make it “fast + safe”:
- Add a sticky bottom action bar (within the same screen) showing:
  - Present/Absent/Late counts
  - Primary action: “Save Attendance”
- Keep per-student controls consistent:
  - Use a uniform 3-option toggle layout (Present / Absent / Late) with equal hit area.
  - Keep roll number + name alignment consistent.
- Prevent accidental loss:
  - If there are unsaved changes and user navigates back, confirm (use existing `Alert`).

### Assignments — List (`/(teacher)/assignments`)
- The current list design is strong. Improvements:
  - Make the right-side action icons more self-explanatory with brief labels or a consistent icon order.
  - Ensure due date formatting is consistent and always includes date + time in the same locale.
  - Add an “At a glance” meta line: “Due … • Max …” (already close; just standardize across rows).

### Assignments — Create (`/(teacher)/assignments/create`)
- Form should feel “premium” and error-proof:
  - Inline validation (title required, max marks numeric, due date valid) before hitting Save.
  - Attachment area:
    - Show a list of uploaded attachments (filename or URL shortened) with a remove action.
    - Show upload progress state clearly (already has `uploading`).
  - Save button:
    - Disabled until valid + show “Saving…” when submitting.

### Materials — List (`/(teacher)/materials`)
- Keep current pattern, improve clarity:
  - Normalize meta: course • file type • unit.
  - Make “Active/Hidden” chip text always visible and consistent with Assignments.
  - Add an “Open” CTA if there’s an existing way to view the link (avoid adding new viewers if not present).

### Results — Index (`/(teacher)/results`)
- This screen is selection-heavy; make it feel structured:
  - Group selectors into a single `Card` with clear labels: Academic year, Exam, Course schedule, Section.
  - Add helper text when lists are empty (e.g., “No published internal/model exams found”).
  - Ensure picker selections always have a safe default and visibly show when something must be selected.

### Notices — Feed (`/(teacher)/notices`)
- Already modern; upgrades:
  - Keep content readable: cap content length per card and ensure consistent spacing.
  - Attachment row should clearly read as a link/CTA (already does); ensure it’s not routed via “create” screen unless that’s intentional.
  - If priorities are important, keep pill tone consistent and always include priority text (already does).

## Consistency Rules (Implementation Checklist)
Use this as a “definition of done” when applying UI changes.

- Every screen has: Header + Loading/Empty/Error handling.
- Every primary action has a disabled/busy state.
- No silent failures: network/db errors show a visible message + Retry.
- Spacing: consistent padding (`16`) and bottom padding accounts for dock (`+ 100–110`).
- No new colors/shadows/fonts; use theme tokens only.

## Suggested Implementation Order (High ROI First)
1) Attendance Mark screen workflow polish (speed + safety)
2) Results selector layout + empty/error states
3) Attendance Index special-day messaging
4) Form consistency for Assignments/Materials/Notices create flows
5) Final pass for copy and spacing consistency across all Teacher screens
