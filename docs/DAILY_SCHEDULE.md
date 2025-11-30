# 📅 DAILY DEVELOPMENT SCHEDULE
## JPM College App - Day-by-Day Task Breakdown

**Target:** 1-2 screens/features per person per day  
**Duration:** 20 weeks = 100 working days  
**Team:** Ash, Abin, Christo, Deon

---

# PHASE 1: PROJECT SETUP (Week 1-2)

## Week 1

### Day 1 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Supabase project setup, enable auth | Supabase dashboard configured |
| **Abin** | Hasura Cloud setup, connect to Supabase | Hasura console ready |
| **Christo** | Expo project init, folder structure | Base project with navigation |
| **Deon** | Install all dependencies, configure babel | Package.json complete |

### Day 2 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Create `profiles`, `roles`, `user_roles` tables | 3 tables + RLS |
| **Abin** | Track tables in Hasura, set relationships | Tables tracked |
| **Christo** | `GlassCard` component | `components/ui/GlassCard.tsx` |
| **Deon** | `GlassInput` component | `components/ui/GlassInput.tsx` |

### Day 3 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Create `departments`, `courses` tables | 2 tables + RLS |
| **Abin** | GraphQL client setup | `lib/graphql/client.ts` |
| **Christo** | `PrimaryButton` component | `components/ui/PrimaryButton.tsx` |
| **Deon** | `Badge`, `Avatar` components | 2 components |

### Day 4 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Create `students`, `teachers` tables | 2 tables + RLS |
| **Abin** | Auth queries/mutations | `lib/graphql/auth.ts` |
| **Christo** | `Modal`, `BottomSheet` components | 2 components |
| **Deon** | `Tabs`, `SearchBar` components | 2 components |

### Day 5 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Create `subjects`, `semesters` tables | 2 tables + RLS |
| **Abin** | `authStore.ts` with Supabase auth | Complete auth store |
| **Christo** | `EmptyState`, `LoadingSpinner` | 2 components |
| **Deon** | `ProgressBar`, `FAB` components | 2 components |

---

## Week 2

### Day 6 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Storage buckets setup | profile-photos, materials buckets |
| **Abin** | `themeStore.ts` | Theme state management |
| **Christo** | `AnimatedBackground` component | Background component |
| **Deon** | `ListItem`, `DatePicker` components | 2 components |

### Day 7 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Seed roles data | 14 roles seeded |
| **Abin** | Profile queries | `lib/graphql/queries.ts` (profile section) |
| **Christo** | Login screen UI | `app/(auth)/login.tsx` |
| **Deon** | Register screen UI | `app/(auth)/register.tsx` |

### Day 8 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Seed test users (1 per role) | Test accounts ready |
| **Abin** | Login/Register mutations | Mutations complete |
| **Christo** | Forgot password screen | `app/(auth)/forgot-password.tsx` |
| **Deon** | OTP verification screen | `app/(auth)/verify-otp.tsx` |

### Day 9 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Auth trigger function | Auto profile creation |
| **Abin** | Role-based navigation logic | Navigation guards |
| **Christo** | Auth layout with transitions | `app/(auth)/_layout.tsx` |
| **Deon** | Connect auth screens to store | Auth flow working |

### Day 10 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Integration testing | Auth flow end-to-end working |
| **ALL** | Bug fixes, code review | Clean auth module |

---

# PHASE 2: ADMIN FOUNDATION (Week 3-4)

## Week 3

### Day 11 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `timetable_master`, `periods` tables | 2 tables + RLS |
| **Abin** | Track new tables, relationships | Hasura updated |
| **Christo** | Admin layout with sidebar | `app/(admin)/_layout.tsx` |
| **Deon** | Admin bottom tabs | Tab navigation |

### Day 12 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `attendance_sessions`, `attendance_records` | 2 tables + RLS |
| **Abin** | Dashboard stats query | Stats GraphQL query |
| **Christo** | `StatCard` component | Reusable stat card |
| **Deon** | `QuickActions` component | Quick action buttons |

### Day 13 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `notices`, `events` tables | 2 tables + RLS |
| **Abin** | `userManagementStore.ts` | User management store |
| **Christo** | Admin Dashboard - stats section | Dashboard top half |
| **Deon** | Admin Dashboard - activity feed | Dashboard bottom half |

### Day 14 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `teaching_materials` table | 1 table + RLS |
| **Abin** | Students list query + pagination | Paginated query |
| **Christo** | Users list screen | `app/(admin)/users.tsx` |
| **Deon** | User detail modal | User details view |

### Day 15 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `assignments`, `submissions` tables | 2 tables + RLS |
| **Abin** | Teachers list query | Teachers query |
| **Christo** | Add/Edit user modal | User form modal |
| **Deon** | Block/Unblock user action | Toggle user status |

---

## Week 4

### Day 16 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `exams`, `exam_schedule` tables | 2 tables + RLS |
| **Abin** | Academic queries | Departments, courses queries |
| **Christo** | Academic management index | `app/(admin)/academic/index.tsx` |
| **Deon** | Departments CRUD screen | Departments management |

### Day 17 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `internal_marks`, `external_uploads` tables | 2 tables + RLS |
| **Abin** | Academic mutations | CRUD mutations |
| **Christo** | Courses CRUD screen | Courses management |
| **Deon** | Subjects CRUD screen | Subjects management |

### Day 18 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `lesson_plans`, `teacher_diary` tables | 2 tables + RLS |
| **Abin** | `academicStore.ts` | Academic management store |
| **Christo** | Semesters management | Semester config |
| **Deon** | Timetable builder - UI | Timetable grid |

### Day 19 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | RLS policies for academic tables | All academic RLS |
| **Abin** | Timetable queries/mutations | Timetable API |
| **Christo** | Timetable period editor | Add/edit periods |
| **Deon** | Timetable view modes | Day/Week views |

### Day 20 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Academic module testing | Full academic flow |
| **ALL** | Bug fixes, UI polish | Clean academic module |

---

# PHASE 3: ADMIN COMPLETE (Week 5-6)

## Week 5

### Day 21 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `books`, `book_issues` tables | 2 tables + RLS |
| **Abin** | Library queries | Books, issues queries |
| **Christo** | Library admin index | `app/(admin)/library/index.tsx` |
| **Deon** | Add/Edit book screen | Book form |

### Day 22 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `bus_routes`, `bus_stops`, `bus_subscriptions` | 3 tables + RLS |
| **Abin** | Library mutations | Issue, return mutations |
| **Christo** | Issue book screen | Issue flow |
| **Deon** | Return book screen | Return flow |

### Day 23 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `canteen_menu_items`, `canteen_tokens` | 2 tables + RLS |
| **Abin** | `libraryStore.ts` | Library store |
| **Christo** | Overdue books list | Overdue tracking |
| **Deon** | Book search & catalog | Catalog view |

### Day 24 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `token_items` table | Token items + RLS |
| **Abin** | Bus queries/mutations | Bus API |
| **Christo** | Bus routes management | Routes CRUD |
| **Deon** | Bus stops management | Stops CRUD |

### Day 25 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `fees_structure`, `fee_payments` tables | 2 tables + RLS |
| **Abin** | `busStore.ts` | Bus management store |
| **Christo** | Bus subscription approvals | Approval screen |
| **Deon** | Bus subscription list | Subscriptions view |

---

## Week 6

### Day 26 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `honors_minor_programs`, `enrollments` tables | 2 tables + RLS |
| **Abin** | Canteen queries | Menu, tokens queries |
| **Christo** | Canteen menu management | Menu CRUD |
| **Deon** | Canteen token list (admin view) | Token tracking |

### Day 27 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `feedback`, `student_settings` tables | 2 tables + RLS |
| **Abin** | `canteenAdminStore.ts` | Canteen admin store |
| **Christo** | Token status update | Mark ready/collected |
| **Deon** | Daily sales summary | Sales dashboard |

### Day 28 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `app_settings` table | Settings table + RLS |
| **Abin** | Fees queries | Fees structure queries |
| **Christo** | Fees structure screen | Fees config |
| **Deon** | Fee collection screen | Payment entry |

### Day 29 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Audit log triggers | Audit logging |
| **Abin** | Settings queries/mutations | Settings API |
| **Christo** | Payment history | Payment list |
| **Deon** | Admin settings screen | `app/(admin)/settings.tsx` |

### Day 30 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Admin module testing | Full admin flow |
| **ALL** | Bug fixes, code review | Clean admin module |

---

# PHASE 4: TEACHER FOUNDATION (Week 7-8)

## Week 7

### Day 31 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Teacher-related RLS review | Secure teacher access |
| **Abin** | Teacher dashboard query | Dashboard stats |
| **Christo** | Teacher layout | `app/(teacher)/_layout.tsx` |
| **Deon** | Teacher bottom tabs | Tab navigation |

### Day 32 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | `teacher_subjects`, `teacher_classes` tables | 2 tables + RLS |
| **Abin** | `teacherDashboardStore.ts` | Teacher dashboard store |
| **Christo** | Teacher dashboard - schedule | Today's periods |
| **Deon** | Teacher dashboard - stats | Quick stats cards |

### Day 33 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Attendance RLS for teachers | Teacher attendance access |
| **Abin** | `attendanceStore.ts` | Attendance marking store |
| **Christo** | Class selection screen | Select class to mark |
| **Deon** | Attendance marking UI | Mark attendance screen |

### Day 34 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Fix any attendance RLS issues | RLS debugging |
| **Abin** | Attendance history query | History API |
| **Christo** | Attendance summary view | Summary charts |
| **Deon** | Edit past attendance | Edit mode |

### Day 35 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Attendance module testing | Full attendance flow |
| **ALL** | Bug fixes | Clean attendance feature |

---

## Week 8

### Day 36 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Internal marks RLS | Marks security |
| **Abin** | `marksStore.ts` | Marks entry store |
| **Christo** | Exam selection screen | Select exam |
| **Deon** | Marks entry UI | Enter marks screen |

### Day 37 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | CSV upload function | Parse CSV server-side |
| **Abin** | CSV parsing in store | Client-side CSV |
| **Christo** | Marks summary view | View entered marks |
| **Deon** | CSV upload UI | Upload marks from CSV |

### Day 38 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Assignment RLS | Assignment security |
| **Abin** | `assignmentStore.ts` | Assignments store |
| **Christo** | Create assignment screen | Assignment form |
| **Deon** | Assignment list screen | View assignments |

### Day 39 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Submission storage bucket | Submissions storage |
| **Abin** | Submissions query | View submissions |
| **Christo** | View submissions screen | Submissions list |
| **Deon** | Grade submission screen | Grading UI |

### Day 40 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Marks & assignments testing | Full flow test |
| **ALL** | Bug fixes | Clean module |

---

# PHASE 5: TEACHER COMPLETE (Week 9-10)

## Week 9

### Day 41 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Teaching materials storage | Materials bucket config |
| **Abin** | Materials queries/mutations | Materials API |
| **Christo** | Upload material screen | Upload form |
| **Deon** | Materials list (teacher view) | My materials |

### Day 42 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Lesson plans RLS | Planner security |
| **Abin** | `plannerStore.ts` | Lesson planner store |
| **Christo** | Create lesson plan | Planner form |
| **Deon** | View lesson plans | Plans calendar |

### Day 43 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Teacher diary RLS | Diary security |
| **Abin** | `diaryStore.ts` | Diary store |
| **Christo** | Diary entry form | Add diary entry |
| **Deon** | Diary list view | View diary |

### Day 44 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Mentor assignment table | Mentor-mentee links |
| **Abin** | Mentor queries | Mentee list query |
| **Christo** | Mentor dashboard | Mentor home |
| **Deon** | Mentee list screen | View mentees |

### Day 45 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Teacher features testing | Full teacher flow |
| **ALL** | Bug fixes | Clean teacher module |

---

## Week 10

### Day 46 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | HoD-specific RLS | HoD permissions |
| **Abin** | `hodStore.ts` | HoD store |
| **Christo** | HoD dashboard | HoD home screen |
| **Deon** | Department stats view | Dept analytics |

### Day 47 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Approval workflow tables | Approval status tracking |
| **Abin** | Approval queries | Pending approvals query |
| **Christo** | Marks verification list | View pending marks |
| **Deon** | Verify/Reject UI | Approval actions |

### Day 48 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Coordinator RLS | Coordinator permissions |
| **Abin** | `coordinatorStore.ts` | Coordinator store |
| **Christo** | Coordinator dashboard | Coordinator home |
| **Deon** | Exam schedule approval | Schedule verification |

### Day 49 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Class teacher RLS | Class teacher access |
| **Abin** | Class teacher queries | My class query |
| **Christo** | Class dashboard | Class overview |
| **Deon** | Class attendance report | Attendance summary |

### Day 50 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Role-specific testing | Test all teacher roles |
| **ALL** | Bug fixes, cleanup | Clean teacher module |

---

# PHASE 6: STUDENT FOUNDATION (Week 11-12)

## Week 11

### Day 51 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Student RLS review | Secure student access |
| **Abin** | Student dashboard query | Dashboard stats |
| **Christo** | Student layout | `app/(student)/_layout.tsx` |
| **Deon** | Student bottom tabs | Tab navigation |

### Day 52 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Profile photo RLS | Photo upload security |
| **Abin** | `studentDashboardStore.ts` | Dashboard store |
| **Christo** | Student dashboard - overview | Main dashboard |
| **Deon** | Dashboard quick links | Quick actions |

### Day 53 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Student profile RLS | Profile security |
| **Abin** | Profile update mutation | Update profile API |
| **Christo** | Profile view screen | View profile |
| **Deon** | Profile edit screen | Edit profile |

### Day 54 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Photo upload trigger | Photo processing |
| **Abin** | Photo upload logic | Upload with store |
| **Christo** | Photo upload UI | Image picker + crop |
| **Deon** | Photo preview component | Photo display |

### Day 55 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Profile module testing | Profile flow complete |
| **ALL** | Bug fixes | Clean profile feature |

---

## Week 12

### Day 56 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Student attendance RLS | View own attendance |
| **Abin** | Attendance summary query | Attendance API |
| **Christo** | Attendance overview | Overall percentage |
| **Deon** | Attendance by subject | Subject-wise view |

### Day 57 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Timetable view RLS | Student timetable access |
| **Abin** | Timetable query | Student timetable query |
| **Christo** | Timetable view | Today's schedule |
| **Deon** | Week timetable view | Full week view |

### Day 58 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Materials view RLS | Access course materials |
| **Abin** | Materials query | Get materials API |
| **Christo** | Materials list | View materials |
| **Deon** | Material detail/download | Download material |

### Day 59 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Assignment submission RLS | Submit assignments |
| **Abin** | `assignmentStudentStore.ts` | Student assignments store |
| **Christo** | Pending assignments | View pending |
| **Deon** | Submit assignment | Submission form |

### Day 60 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Student academic testing | Full academic flow |
| **ALL** | Bug fixes | Clean academic features |

---

# PHASE 7: STUDENT EXAMS (Week 13-14)

## Week 13

### Day 61 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Exam schedule student RLS | View exam schedule |
| **Abin** | Exam schedule query | Student exams API |
| **Christo** | Exam schedule screen | View exams |
| **Deon** | Exam countdown widget | Days to exam |

### Day 62 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Internal marks view RLS | View own marks |
| **Abin** | Marks query | Get marks API |
| **Christo** | Internal marks view | View marks |
| **Deon** | Marks history | Past semesters |

### Day 63 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | External upload RLS | Upload external marks |
| **Abin** | `externalMarksStore.ts` | External marks store |
| **Christo** | External upload form | Upload screen |
| **Deon** | Upload status tracker | View upload status |

### Day 64 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Results RLS | View results |
| **Abin** | Results query | Get results API |
| **Christo** | Results view | Semester results |
| **Deon** | CGPA calculator | Calculate CGPA |

### Day 65 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Exam module testing | Full exam flow |
| **ALL** | Bug fixes | Clean exam features |

---

## Week 14

### Day 66 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Library student RLS | View/request books |
| **Abin** | `libraryStudentStore.ts` | Student library store |
| **Christo** | My books screen | Borrowed books |
| **Deon** | Book catalog search | Search books |

### Day 67 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Book request trigger | Book request workflow |
| **Abin** | Book history query | Issue history |
| **Christo** | Book detail screen | Book info |
| **Deon** | Due date reminders | Overdue alerts |

### Day 68 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Bus student RLS | Subscribe to bus |
| **Abin** | `busStudentStore.ts` | Student bus store |
| **Christo** | Bus routes view | View routes |
| **Deon** | Bus subscription form | Subscribe screen |

### Day 69 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Subscription approval trigger | Auto-notify on approval |
| **Abin** | Subscription status query | Check status |
| **Christo** | Subscription status | View my subscription |
| **Deon** | Route map view | Route visualization |

### Day 70 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Library & Bus testing | Full flow test |
| **ALL** | Bug fixes | Clean features |

---

# PHASE 8: STUDENT COMPLETE (Week 15-16)

## Week 15

### Day 71 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Canteen student RLS | Order tokens |
| **Abin** | `canteenStudentStore.ts` | Canteen store |
| **Christo** | Menu view | Today's menu |
| **Deon** | Cart component | Add to cart |

### Day 72 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Token generation trigger | Auto token number |
| **Abin** | Token status query | Token tracking |
| **Christo** | Place order flow | Order screen |
| **Deon** | My tokens list | Token history |

### Day 73 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Token status update trigger | Status notifications |
| **Abin** | Real-time subscription | Live token updates |
| **Christo** | Token status screen | View token status |
| **Deon** | Token QR display | Show token QR |

### Day 74 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Events RLS | View events |
| **Abin** | Events query | Get events API |
| **Christo** | Events list | View events |
| **Deon** | Event detail | Event info screen |

### Day 75 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Canteen & Events testing | Full flow test |
| **ALL** | Bug fixes | Clean features |

---

## Week 16

### Day 76 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Honors/Minor RLS | Apply to programs |
| **Abin** | `honorsStore.ts` | Honors/Minor store |
| **Christo** | Available programs | Programs list |
| **Deon** | Program detail | Program info |

### Day 77 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Enrollment trigger | Enrollment workflow |
| **Abin** | Enrollment query | My enrollments |
| **Christo** | Apply screen | Application form |
| **Deon** | Enrollment status | Track application |

### Day 78 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Feedback RLS | Submit feedback |
| **Abin** | Feedback mutation | Submit API |
| **Christo** | Feedback form | Submit feedback |
| **Deon** | Feedback history | My feedback |

### Day 79 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Student settings RLS | User preferences |
| **Abin** | Settings store | Preferences store |
| **Christo** | Notification settings | Toggle notifications |
| **Deon** | Settings screen | Full settings |

### Day 80 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Complete student testing | All student features |
| **ALL** | Bug fixes | Clean student module |

---

# PHASE 9: INTEGRATION (Week 17-18)

## Week 17

### Day 81 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Cross-module RLS audit | Security review |
| **Abin** | API performance review | Query optimization |
| **Christo** | UI consistency review | Design system check |
| **Deon** | Navigation flow review | UX improvements |

### Day 82 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Fix RLS issues | RLS fixes |
| **Abin** | Optimize slow queries | Performance fixes |
| **Christo** | Fix UI inconsistencies | UI fixes |
| **Deon** | Fix navigation issues | UX fixes |

### Day 83 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Push notification setup | FCM config |
| **Abin** | Notification triggers | Backend notifications |
| **Christo** | Notification UI | In-app notifications |
| **Deon** | Notification preferences | Notification settings |

### Day 84 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Notification testing | Test all triggers |
| **Abin** | Notification store | Notification state |
| **Christo** | Notification list | View notifications |
| **Deon** | Mark read/unread | Notification actions |

### Day 85 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Full integration test | Cross-module testing |
| **ALL** | Bug fixes | Integration fixes |

---

## Week 18

### Day 86 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Offline support config | Offline mode setup |
| **Abin** | Offline data sync | Sync logic |
| **Christo** | Offline indicators | UI for offline |
| **Deon** | Sync status UI | Sync progress |

### Day 87 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Error logging setup | Error tracking |
| **Abin** | Error boundaries | Catch errors |
| **Christo** | Error screens | Error UI |
| **Deon** | Retry mechanisms | Retry logic |

### Day 88 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Analytics events | Track key events |
| **Abin** | Analytics integration | Analytics store |
| **Christo** | Track screen views | Screen analytics |
| **Deon** | Track user actions | Action analytics |

### Day 89 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Performance monitoring | DB monitoring |
| **Abin** | App performance | Client monitoring |
| **Christo** | Image optimization | Optimize assets |
| **Deon** | Bundle optimization | Reduce bundle |

### Day 90 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Performance testing | Full performance test |
| **ALL** | Optimization | Performance fixes |

---

# PHASE 10: TESTING & LAUNCH (Week 19-20)

## Week 19

### Day 91 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | E2E test environment | Test DB setup |
| **Abin** | Detox setup | E2E framework |
| **Christo** | Auth E2E tests | Login/register tests |
| **Deon** | Admin E2E tests | Admin flow tests |

### Day 92 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Test data seeding | Seed test data |
| **Abin** | Teacher E2E tests | Teacher flow tests |
| **Christo** | Student E2E tests | Student flow tests |
| **Deon** | Fix failing tests | Test fixes |

### Day 93 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Security audit | Security review |
| **Abin** | API security tests | API security |
| **Christo** | Input validation | Validate all inputs |
| **Deon** | Error handling | Handle edge cases |

### Day 94 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Full regression test | Test everything |
| **ALL** | Bug fixes | Fix all issues |

### Day 95 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | UAT preparation | Prepare for UAT |
| **ALL** | Documentation | Update docs |

---

## Week 20

### Day 96 (Mon)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Production DB setup | Prod Supabase |
| **Abin** | Prod Hasura config | Prod GraphQL |
| **Christo** | App icons & splash | Final assets |
| **Deon** | Store screenshots | App store assets |

### Day 97 (Tue)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Production secrets | Env variables |
| **Abin** | Build configuration | Release build |
| **Christo** | Android build | APK/AAB |
| **Deon** | iOS build | IPA |

### Day 98 (Wed)
| Member | Task | Deliverable |
|--------|------|-------------|
| **Ash** | Production data migration | Migrate data |
| **Abin** | API testing prod | Test prod API |
| **Christo** | Android testing | Test on devices |
| **Deon** | iOS testing | Test on devices |

### Day 99 (Thu)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | Final bug fixes | Last fixes |
| **ALL** | Store submission prep | Prepare submissions |

### Day 100 (Fri)
| Member | Task | Deliverable |
|--------|------|-------------|
| **ALL** | App store submission | Submit to stores |
| **ALL** | Launch! 🚀 | App live |

---

# 📊 QUICK REFERENCE

## Daily Standup Template
```
What I did yesterday: [task]
What I'm doing today: [task]
Blockers: [any blockers]
```

## PR Naming Convention
```
[MODULE]-[DAY]-[MEMBER]: Brief description
Example: ADMIN-16-CHRISTO: Academic management index
```

## Branch Naming
```
feature/day-XX-[member]-[brief-description]
Example: feature/day-16-christo-academic-index
```

---

*Daily Schedule - Last Updated: November 30, 2025*
