#!/usr/bin/env node
/*
  Generate DATABASE_SCHEMA_INVENTORY.md from JSON produced by extract-schema-inventory.js

  Usage:
    node scripts/generate-schema-inventory-md.js --in scripts/schema_inventory.json --out DATABASE_SCHEMA_INVENTORY.md
*/

const fs = require('fs');
const path = require('path');

function argValue(args, flag, fallback) {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  return args[i + 1] || fallback;
}

function sanitizeForMermaid(name) {
  return String(name).replace(/[^A-Za-z0-9_]/g, '_');
}

function moduleBuckets(tableNames) {
  const has = (n) => tableNames.includes(n);

  const buckets = {
    'RBAC & Users': [
      'profiles',
      'user_roles',
      'roles',
      'users', // external (auth.users)
      'students',
      'teachers',
      'departments',
      'sections',
      'years',
      'semesters',
      'academic_years',
      'programs',
    ].filter(has),
    Academics: [
      'departments',
      'academic_years',
      'years',
      'semesters',
      'sections',
      'courses',
      'subjects',
      'teacher_courses',
      'batches',
      'timetable_entries',
      'period_timings',
      'substitutions',
      'minor_subjects',
      'student_minor_registrations',
    ].filter(has),
    Attendance: [
      'attendance',
      'attendance_records',
      'attendance_logs',
      'late_passes',
      'holidays',
      'attendance_delegations',
    ].filter(has),
    Exams: ['exams', 'exam_schedules', 'exam_marks', 'external_marks'].filter(has),
    Assignments: ['assignments', 'assignment_submissions', 'teaching_materials', 'lesson_planners', 'work_diaries'].filter(has),
    Library: ['books', 'book_issues', 'book_reservations'].filter(has),
    Fees: ['fee_structures', 'student_fees', 'fee_payments'].filter(has),
    Transport: ['bus_routes', 'bus_stops', 'student_bus_registrations', 'bus_announcements', 'bus_subscriptions'].filter(has),
    Canteen: ['canteen_menu_items', 'canteen_daily_menu', 'canteen_tokens'].filter(has),
    Notices: ['notices', 'notice_reads'].filter(has),
    Events: ['events', 'event_certificates'].filter(has),
    Admin: ['audit_logs', 'college_info', 'admission_config', 'allowed_students', 'otp_verifications', 'parents'].filter(has),
  };

  // Remove empty buckets
  for (const k of Object.keys(buckets)) {
    if (!buckets[k].length) delete buckets[k];
  }

  return buckets;
}

function buildErDiagram(tableNames, edges, title, limitTables = null) {
  const include = limitTables ? new Set(limitTables) : null;

  const used = new Set();
  const filteredEdges = [];
  for (const e of edges) {
    if (include) {
      if (!(include.has(e.fromTable) || include.has(e.toTable))) continue;
    }
    filteredEdges.push(e);
    used.add(e.fromTable);
    used.add(e.toTable);
  }

  // Ensure entities exist even if no edges
  const entities = include ? [...include] : tableNames;

  const lines = [];
  if (title) {
    lines.push(`### ${title}`);
    lines.push('');
  }
  lines.push('```mermaid');
  lines.push('erDiagram');

  for (const t of entities) {
    if (include && !used.has(t) && !include.has(t)) continue;
    lines.push(`  ${sanitizeForMermaid(t)} {}`);
  }

  for (const e of filteredEdges) {
    const from = sanitizeForMermaid(e.fromTable);
    const to = sanitizeForMermaid(e.toTable);
    const label = `${e.fromCol}→${e.toCol}`.replace(/\s+/g, ' ');
    lines.push(`  ${from} }o--|| ${to} : "${label}"`);
  }

  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const inPath = argValue(args, '--in', 'scripts/schema_inventory.json');
  const outPath = argValue(args, '--out', 'DATABASE_SCHEMA_INVENTORY.md');

  const inv = JSON.parse(fs.readFileSync(path.resolve(inPath), 'utf8'));

  const tableNames = inv.tables.map((t) => t.name);
  const edges = inv.foreignKeys;

  const lines = [];
  lines.push('# Database schema inventory (from SQL files)');
  lines.push('');
  lines.push('Generated from `supabase/migrations/**/*.sql` and `database/**/*.sql` by `scripts/extract-schema-inventory.js`.');
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- Generated at: ${inv.generatedAt}`);
  lines.push(`- SQL files scanned: ${inv.sqlFileCount}`);
  lines.push(`- Tables found: ${inv.tables.length}`);
  lines.push(`- Foreign-key links found: ${inv.foreignKeys.length}`);
  lines.push(`- SQL functions found: ${inv.functions.length}`);
  lines.push('');

  // Notes: books vs library_books
  const hasBooks = tableNames.includes('books');
  const hasLibraryBooks = tableNames.includes('library_books');
  if (hasBooks && !hasLibraryBooks) {
    lines.push('## Notes');
    lines.push('');
    lines.push('- Schema contains `books` table, not `library_books` (update any remaining code/docs that reference `library_books`).');
    lines.push('');
  }

  if (inv.externalTables && inv.externalTables.length) {
    lines.push('## External referenced tables');
    lines.push('');
    lines.push('These are referenced by FKs but not created in scanned SQL (example: `auth.users`).');
    lines.push('');
    for (const t of inv.externalTables) lines.push(`- ${t}`);
    lines.push('');
  }

  // RBAC model description
  lines.push('## Roles & permissions model');
  lines.push('');
  lines.push('- Roles are stored in `roles` and permissions are stored as `roles.permissions` (JSONB).');
  lines.push('- Role assignment is `profiles` → `user_roles` → `roles` (many-to-many).');
  lines.push('- Permission checks use SQL functions: `has_permission`, `can_access_module`, `get_user_permissions`, `is_user_admin`.');
  lines.push('');

  // RBAC-specific diagram (small)
  const rbacSet = ['users', 'profiles', 'user_roles', 'roles', 'departments'];
  lines.push(buildErDiagram(tableNames, edges, 'RBAC / users ERD', rbacSet.filter((t) => tableNames.includes(t) || (inv.externalTables || []).includes(t))));

  // All tables
  lines.push('## All tables');
  lines.push('');
  lines.push('| Table | Defined in (first file) |');
  lines.push('| --- | --- |');
  for (const t of inv.tables) {
    lines.push(`| ${t.name} | ${(t.definedIn && t.definedIn[0]) || ''} |`);
  }
  lines.push('');

  // Functions
  lines.push('## SQL functions');
  lines.push('');
  lines.push('| Function | Defined in |');
  lines.push('| --- | --- |');
  for (const f of inv.functions) {
    lines.push(`| ${f.name} | ${f.file} |`);
  }
  lines.push('');

  // Full ERD
  lines.push('## Full ER diagram (Mermaid)');
  lines.push('');
  lines.push(buildErDiagram(tableNames, edges, null, null));

  // Module diagrams
  lines.push('## Module ER diagrams (smaller)');
  lines.push('');
  lines.push('These are the same relationships as the full ERD, split into smaller diagrams for easier rendering.');
  lines.push('');

  const buckets = moduleBuckets(tableNames);
  for (const [name, list] of Object.entries(buckets)) {
    lines.push(buildErDiagram(tableNames, edges, name, list));
  }

  fs.writeFileSync(path.resolve(outPath), lines.join('\n'), 'utf8');
  console.log('Wrote', path.relative(process.cwd(), path.resolve(outPath)));
}

main();
