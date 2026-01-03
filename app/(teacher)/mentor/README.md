Mentor module (teacher-side)

Current implementation:
- Lists mentor assignments for current academic year
- Allows adding mentoring sessions (notes)

Requires:
- `mentor_assignments` table linking mentor to student
- `mentoring_sessions` table with RLS that allows mentors to insert/select sessions for their assignments
