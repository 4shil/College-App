/**
 * Seed Test Data for Admin Modules
 * Creates sample data for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function seedTestData() {
  log('\n📦 Seeding Test Data...', colors.cyan);

  try {
    // Get required IDs
    const { data: courses } = await supabase.from('courses').select('id').limit(1);
    const { data: semesters } = await supabase.from('semesters').select('id').limit(1);
    const { data: academicYears } = await supabase.from('academic_years').select('id').limit(1);
    const { data: departments } = await supabase.from('departments').select('id').limit(1);
    const { data: teachers } = await supabase.from('teachers').select('id, user_id').limit(1);
    const { data: students } = await supabase.from('students').select('id, user_id, roll_number').limit(5);

    if (!courses?.length || !semesters?.length || !academicYears?.length || !departments?.length) {
      log('⚠️  Missing base data. Please run seed-db.js first', colors.yellow);
      return false;
    }

    const courseId = courses[0].id;
    const semesterId = semesters[0].id;
    const academicYearId = academicYears[0].id;
    const departmentId = departments[0].id;
    const teacherId = teachers?.[0]?.id;
    const teacherUserId = teachers?.[0]?.user_id;

    log('\n📚 Creating Library Test Data...', colors.cyan);
    
    // Create books
    const { data: books, error: booksError } = await supabase.from('books').insert([
      {
        title: 'Introduction to Computer Science',
        author: 'John Doe',
        isbn: '978-0-123456-78-9',
        publisher: 'Tech Publishers',
        category: 'Computer Science',
        total_copies: 10,
        available_copies: 8,
        shelf_location: 'A1-CS',
      },
      {
        title: 'Data Structures and Algorithms',
        author: 'Jane Smith',
        isbn: '978-0-987654-32-1',
        publisher: 'Academic Press',
        category: 'Computer Science',
        total_copies: 5,
        available_copies: 3,
        shelf_location: 'A2-CS',
      },
      {
        title: 'Database Management Systems',
        author: 'Robert Johnson',
        isbn: '978-0-456789-12-3',
        publisher: 'DB Publishers',
        category: 'Databases',
        total_copies: 8,
        available_copies: 8,
        shelf_location: 'B1-DB',
      },
    ]).select();

    if (booksError) {
      log(`⚠️  Books: ${booksError.message}`, colors.yellow);
    } else {
      log(`✅ Created ${books.length} books`, colors.green);

      // Create book issues if we have students
      if (students && students.length > 0 && teacherUserId) {
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const { data: issues, error: issuesError } = await supabase.from('book_issues').insert([
          {
            book_id: books[0].id,
            user_id: students[0].user_id,
            issued_by: teacherUserId,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'issued',
          },
          {
            book_id: books[1].id,
            user_id: students[1]?.user_id,
            issued_by: teacherUserId,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'issued',
          },
        ]).select();

        if (issuesError) {
          log(`⚠️  Book issues: ${issuesError.message}`, colors.yellow);
        } else {
          log(`✅ Created ${issues?.length || 0} book issues`, colors.green);
        }
      }
    }

    log('\n💰 Creating Fees Test Data...', colors.cyan);

    // Create fee structure
    const { data: feeStructures, error: feeStructError } = await supabase.from('fee_structures').insert([
      {
        name: 'Semester 1 Fees 2024-25',
        department_id: departmentId,
        semester_id: semesterId,
        academic_year_id: academicYearId,
        tuition_fee: 25000,
        exam_fee: 2000,
        lab_fee: 3000,
        library_fee: 1000,
        sports_fee: 500,
        other_fees: 1500,
        total_amount: 33000,
        due_date: '2025-01-15',
      },
    ]).select();

    if (feeStructError) {
      log(`⚠️  Fee structures: ${feeStructError.message}`, colors.yellow);
    } else {
      log(`✅ Created ${feeStructures.length} fee structures`, colors.green);

      // Create student fees if we have students
      if (students && students.length > 0) {
        const studentFeesData = students.slice(0, 3).map((student, idx) => ({
          student_id: student.id,
          fee_structure_id: feeStructures[0].id,
          amount_due: 33000,
          amount_paid: idx === 0 ? 33000 : idx === 1 ? 20000 : 0,
          payment_status: idx === 0 ? 'paid' : idx === 1 ? 'partial' : 'pending',
          due_date: '2025-01-15',
        }));

        const { data: studentFees, error: studentFeesError } = await supabase
          .from('student_fees')
          .insert(studentFeesData)
          .select();

        if (studentFeesError) {
          log(`⚠️  Student fees: ${studentFeesError.message}`, colors.yellow);
        } else {
          log(`✅ Created ${studentFees?.length || 0} student fee records`, colors.green);

          // Create payment for first student
          if (studentFees && studentFees.length > 0) {
            const { error: paymentError } = await supabase.from('fee_payments').insert([
              {
                student_fee_id: studentFees[0].id,
                amount: 33000,
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'upi',
                receipt_number: 'REC-001',
              },
            ]);

            if (!paymentError) {
              log(`✅ Created 1 fee payment`, colors.green);
            }
          }
        }
      }
    }

    log('\n📝 Creating Exams Test Data...', colors.cyan);

    // Create exam
    const { data: exams, error: examsError } = await supabase.from('exams').insert([
      {
        name: 'Mid Semester Exam',
        exam_type: 'internal',
        academic_year_id: academicYearId,
        semester_id: semesterId,
        start_date: '2025-02-01',
        end_date: '2025-02-15',
        is_published: true,
      },
    ]).select();

    if (examsError) {
      log(`⚠️  Exams: ${examsError.message}`, colors.yellow);
    } else {
      log(`✅ Created ${exams.length} exams`, colors.green);

      // Create exam schedule
      if (exams.length > 0) {
        const { error: scheduleError } = await supabase.from('exam_schedules').insert([
          {
            exam_id: exams[0].id,
            course_id: courseId,
            exam_date: '2025-02-05',
            start_time: '09:00:00',
            end_time: '12:00:00',
            max_marks: 100,
            room: 'Room 101',
          },
        ]);

        if (!scheduleError) {
          log(`✅ Created 1 exam schedule`, colors.green);
        }
      }
    }

    log('\n📋 Creating Assignments Test Data...', colors.cyan);

    if (teacherId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const { data: assignments, error: assignmentsError } = await supabase.from('assignments').insert([
        {
          title: 'Data Structures Assignment 1',
          description: 'Implement linked list operations',
          course_id: courseId,
          teacher_id: teacherId,
          due_date: dueDate.toISOString(),
          max_marks: 10,
          status: 'active',
        },
        {
          title: 'Algorithm Analysis Assignment',
          description: 'Analyze time complexity of sorting algorithms',
          course_id: courseId,
          teacher_id: teacherId,
          due_date: dueDate.toISOString(),
          max_marks: 15,
          status: 'active',
        },
      ]).select();

      if (assignmentsError) {
        log(`⚠️  Assignments: ${assignmentsError.message}`, colors.yellow);
      } else {
        log(`✅ Created ${assignments.length} assignments`, colors.green);

        // Create submissions if we have students
        if (students && students.length > 0 && assignments.length > 0) {
          const submissionsData = [];
          students.slice(0, 3).forEach((student, idx) => {
            submissionsData.push({
              assignment_id: assignments[0].id,
              student_id: student.id,
              submission_urls: ['https://example.com/submission.pdf'],
              marks_obtained: idx === 0 ? 9 : idx === 1 ? 8 : null,
              status: idx < 2 ? 'graded' : 'submitted',
            });
          });

          const { error: submissionsError } = await supabase
            .from('assignment_submissions')
            .insert(submissionsData);

          if (!submissionsError) {
            log(`✅ Created ${submissionsData.length} assignment submissions`, colors.green);
          }
        }
      }
    }

    log('\n✅ Test data seeding complete!', colors.green);
    return true;
  } catch (error) {
    log(`\n❌ Seeding failed: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// Run seeding
seedTestData().then(success => {
  if (success) {
    log('\n🎉 Ready for testing!', colors.green);
  }
  process.exit(success ? 0 : 1);
});
