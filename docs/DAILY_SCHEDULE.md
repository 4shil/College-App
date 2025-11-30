# 📅 VIBE CODERS DAILY SCHEDULE
## JPM College App - Aggressive 8-Week Sprint

**Target:** 3-5 screens/features per person per day  
**Duration:** 8 weeks = 40 working days  
**Team:** Ash, Abin, Christo, Deon  
**Motto:** "Ship fast, fix faster" 🚀

---

# WEEK 1: FULL FOUNDATION

## Day 1 (Mon) - Setup + Auth + Core UI
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Supabase + `profiles`, `roles`, `user_roles`, `departments`, `courses` + ALL RLS | 5 tables + RLS |
| **Abin** | Hasura + track tables + GraphQL client + `authStore.ts` + `themeStore.ts` | Full backend ready |
| **Christo** | `GlassCard`, `GlassInput`, `PrimaryButton`, `Badge`, `Avatar`, `Modal`, Login | 6 components + 1 screen |
| **Deon** | `Tabs`, `SearchBar`, `EmptyState`, `Spinner`, `ProgressBar`, `FAB`, Register | 6 components + 1 screen |

## Day 2 (Tue) - Auth Complete + Admin Layout
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `students`, `teachers`, `subjects`, `semesters` + storage buckets + seed all roles | 4 tables + storage |
| **Abin** | All auth queries/mutations, navigation guards, profile queries | Full auth API |
| **Christo** | Forgot password, OTP, Auth layout, `AnimatedBackground`, Admin layout | 4 screens/layouts |
| **Deon** | `ListItem`, `DatePicker`, `BottomSheet`, connect auth to stores | 3 components + integration |

## Day 3 (Wed) - Admin Users + Dashboard
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `timetable_master`, `periods`, `attendance_sessions`, `attendance_records`, `notices`, `events` | 6 tables + RLS |
| **Abin** | `userManagementStore.ts`, `academicStore.ts`, dashboard stats query | 2 stores + queries |
| **Christo** | Admin dashboard (FULL), `StatCard`, `QuickActions`, Users list | 4 features |
| **Deon** | User detail, Add/Edit user, Block user, Academic index | 4 screens |

## Day 4 (Thu) - Academic + Timetable + Notices
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `teaching_materials`, `assignments`, `submissions`, `exams`, `exam_schedule` | 5 tables + RLS |
| **Abin** | `noticeStore.ts`, `eventStore.ts`, timetable queries, academic mutations | 2 stores + APIs |
| **Christo** | Departments CRUD, Courses CRUD, Subjects CRUD, Semesters | 4 CRUD screens |
| **Deon** | Timetable builder (FULL), Notices CRUD, Events CRUD | 3 full modules |

## Day 5 (Fri) - Library + Bus + Exams
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `books`, `book_issues`, `bus_routes`, `bus_stops`, `bus_subscriptions`, `internal_marks`, `external_uploads` | 7 tables |
| **Abin** | `libraryStore.ts`, `busStore.ts`, `examAdminStore.ts` | 3 stores |
| **Christo** | Library CRUD (add, issue, return, overdue), Book catalog | 5 screens |
| **Deon** | Bus CRUD (routes, stops), Subscriptions, Exam CRUD (create, list, schedule) | 5 screens |

---

# WEEK 2: ADMIN COMPLETE + TEACHER START

## Day 6 (Mon) - Canteen + Fees + Settings
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `canteen_menu_items`, `canteen_tokens`, `token_items`, `fees_structure`, `fee_payments`, `app_settings` | 6 tables |
| **Abin** | `canteenAdminStore.ts`, `feesStore.ts`, `settingsStore.ts` | 3 stores |
| **Christo** | Canteen menu CRUD, Token list, Token status, Sales summary | 4 screens |
| **Deon** | Fees structure, Fee collection, Payment history, Admin settings | 4 screens |

## Day 7 (Tue) - Honors + Teacher Layout + Dashboard
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `honors_minor_programs`, `honors_minor_enrollments`, `lesson_plans`, `teacher_diary`, `feedback`, `student_settings` | 6 tables |
| **Abin** | `teacherDashboardStore.ts`, teacher queries, today's schedule query | 1 store + queries |
| **Christo** | Honors admin, Enrollment management, Teacher layout | 3 screens |
| **Deon** | Teacher dashboard (FULL), Today's classes, Pending tasks | 3 screens |

## Day 8 (Wed) - Attendance + Marks
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | `teacher_subjects`, `teacher_classes`, all teacher RLS, attendance RLS | Tables + RLS |
| **Abin** | `attendanceStore.ts`, `marksStore.ts` (with CSV parser) | 2 stores |
| **Christo** | Class selection, Attendance marking (FULL), Attendance history | 3 screens |
| **Deon** | Exam selection, Marks entry (FULL), CSV upload, Marks summary | 4 screens |

## Day 9 (Thu) - Assignments + Materials
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Assignment RLS, materials storage bucket, submissions bucket | RLS + storage |
| **Abin** | `assignmentStore.ts`, `materialsStore.ts`, submissions query | 2 stores |
| **Christo** | Create assignment, Assignment list, View submissions, Grade | 4 screens |
| **Deon** | Upload material, Materials list, Edit/delete material, Preview | 4 screens |

## Day 10 (Fri) - Planner + Diary + Mentor
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Mentor tables, lesson plan RLS, diary RLS | Tables + RLS |
| **Abin** | `plannerStore.ts`, `diaryStore.ts`, mentor queries | 2 stores |
| **Christo** | Lesson planner (create, view, calendar), Plans list | 4 screens |
| **Deon** | Teacher diary (add, view, date picker), Mentor dashboard, Mentees | 5 screens |

---

# WEEK 3: TEACHER ROLES + STUDENT START

## Day 11 (Mon) - HoD + Coordinator + Class Teacher
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | HoD RLS, Coordinator RLS, Class teacher RLS, approval workflows | All role RLS |
| **Abin** | `hodStore.ts`, `coordinatorStore.ts`, approval queries | 2 stores |
| **Christo** | HoD dashboard, Dept stats, Marks verification, Approve/reject | 4 screens |
| **Deon** | Coordinator dashboard, Schedule approval, Class dashboard, Class report | 4 screens |

## Day 12 (Tue) - Student Foundation
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | All student RLS, profile photo RLS, photo upload trigger | Student security |
| **Abin** | `studentDashboardStore.ts`, profile mutations, dashboard query | 1 store |
| **Christo** | Student layout, Student dashboard (FULL), Quick links | 3 screens |
| **Deon** | Profile view, Profile edit, Photo upload, Photo preview | 4 screens |

## Day 13 (Wed) - Attendance + Timetable + Materials
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Student attendance view RLS, timetable RLS, materials RLS | RLS updates |
| **Abin** | Attendance queries, timetable query, materials query | All queries |
| **Christo** | Attendance overview, By subject, Attendance calendar | 3 screens |
| **Deon** | Timetable (today + week), Materials list, Material download | 4 screens |

## Day 14 (Thu) - Assignments + Exams
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Submission RLS, exam view RLS, marks view RLS | RLS updates |
| **Abin** | `assignmentStudentStore.ts`, `examStudentStore.ts` | 2 stores |
| **Christo** | Pending/submitted assignments, Submit assignment, Detail | 4 screens |
| **Deon** | Exam schedule, Countdown, Marks view, Marks history | 4 screens |

## Day 15 (Fri) - External Marks + Results + Library
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | External upload RLS, results RLS, library student RLS | RLS updates |
| **Abin** | `externalMarksStore.ts`, `libraryStudentStore.ts`, results query | 2 stores |
| **Christo** | External upload, Upload status, Results view, CGPA calc | 4 screens |
| **Deon** | My books, Book catalog, Book detail, Due reminders | 4 screens |

---

# WEEK 4: STUDENT COMPLETE

## Day 16 (Mon) - Bus + Canteen
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Bus student RLS, canteen student RLS, token triggers | RLS + triggers |
| **Abin** | `busStudentStore.ts`, `canteenStudentStore.ts`, realtime | 2 stores |
| **Christo** | Bus routes, Subscribe, Status, Route map | 4 screens |
| **Deon** | Menu view, Cart, Place order, Order confirm | 4 screens |

## Day 17 (Tue) - Canteen Tokens + Events
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Token number trigger, status notification trigger, events RLS | Triggers + RLS |
| **Abin** | Events query, token status subscription | Queries |
| **Christo** | My tokens, Token status, Token QR, Token history | 4 screens |
| **Deon** | Events list, Event detail, External link handler | 3 screens |

## Day 18 (Wed) - Honors + Feedback + Settings
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Honors student RLS, enrollment trigger, feedback RLS | RLS + triggers |
| **Abin** | `honorsStore.ts`, feedback mutations, settings store | 2 stores |
| **Christo** | Available programs, Program detail, Apply, Status | 4 screens |
| **Deon** | Feedback form, History, Settings (notifications, theme, logout) | 4 screens |

## Day 19 (Thu) - All Modules Polish
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Test all student flows, fix bugs, UI consistency | Student complete |

## Day 20 (Fri) - Full Integration Test
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Cross-module testing, Admin→Teacher→Student flows | All flows working |

---

# WEEK 5: INTEGRATION + NOTIFICATIONS

## Day 21 (Mon) - RLS Audit + Performance
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Full RLS security audit, fix vulnerabilities | Security verified |
| **Abin** | Query optimization, N+1 fixes, caching | Performance tuned |
| **Christo** | UI consistency audit, fix design issues | UI polished |
| **Deon** | Navigation audit, UX improvements | UX improved |

## Day 22 (Tue) - Push Notifications
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | FCM setup, notification triggers (attendance, assignments, tokens) | Backend notifications |
| **Abin** | `notificationStore.ts`, notification queries | 1 store |
| **Christo** | Notification list, Badges, In-app alerts | 3 features |
| **Deon** | Mark read, Preferences, Clear all, Push handling | 4 features |

## Day 23 (Wed) - Offline + Error Handling
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Offline strategy, sync functions | Offline backend |
| **Abin** | Offline data sync, error boundaries | Offline client |
| **Christo** | Offline indicators, Error screens, Retry UI | 3 features |
| **Deon** | Sync status, Retry logic, Error toasts | 3 features |

## Day 24 (Thu) - Analytics + Monitoring
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Analytics events, DB monitoring setup | Analytics backend |
| **Abin** | Analytics integration, performance tracking | Analytics client |
| **Christo** | Image optimization, lazy loading | Optimizations |
| **Deon** | Bundle optimization, code splitting | Optimizations |

## Day 25 (Fri) - Full Regression
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Complete regression test, fix all bugs | All features stable |

---

# WEEK 6: E2E TESTING

## Day 26 (Mon) - Test Setup + Auth Tests
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | E2E test DB, seed test data | Test infrastructure |
| **Abin** | Detox setup, test helpers | E2E framework |
| **Christo** | Auth tests (login, register, forgot, OTP) | 4 test suites |
| **Deon** | Role switching tests, navigation tests | 2 test suites |

## Day 27 (Tue) - Module E2E Tests
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Generate comprehensive test data | All test scenarios |
| **Abin** | Admin E2E (users, academic, exams) | Admin suite |
| **Christo** | Teacher E2E (attendance, marks, materials) | Teacher suite |
| **Deon** | Student E2E (all features) | Student suite |

## Day 28 (Wed) - Security + Edge Cases
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Security audit, SQL injection tests | Security passed |
| **Abin** | API security, rate limiting | API secured |
| **Christo** | Input validation, XSS prevention | Frontend secure |
| **Deon** | Edge cases, error scenarios | All handled |

## Day 29 (Thu) - Fix + Retest
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Fix failing tests, rerun all E2E | All tests pass |

## Day 30 (Fri) - UAT Prep
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Prepare UAT environment, user guides | UAT ready |

---

# WEEK 7: UAT + POLISH

## Day 31-33 (Mon-Wed) - UAT Sessions
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Conduct UAT with stakeholders, collect feedback | Feedback documented |

## Day 34 (Thu) - UAT Bug Fixes
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Fix all UAT issues | Bugs fixed |

## Day 35 (Fri) - Final Polish
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Final UI polish, animation tweaks | App polished |

---

# WEEK 8: PRODUCTION + LAUNCH

## Day 36 (Mon) - Production Setup
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Prod Supabase, secrets, data migration | Prod backend |
| **Abin** | Prod Hasura, API testing | Prod API |
| **Christo** | App icons, splash, store screenshots | Store assets |
| **Deon** | Store descriptions, privacy policy | Store materials |

## Day 37 (Tue) - Build + Test
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **Ash** | Final data migration, backup strategy | Data ready |
| **Abin** | Release build config | Build config |
| **Christo** | Android build (APK/AAB), device testing | Android ready |
| **Deon** | iOS build (IPA), device testing | iOS ready |

## Day 38 (Wed) - Production Testing
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Full production test on real devices | Prod verified |

## Day 39 (Thu) - Submission
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | App store submission | Submitted |

## Day 40 (Fri) - LAUNCH! 🚀
| Member | Tasks | Deliverables |
|--------|-------|--------------|
| **ALL** | Monitor launch, celebrate! | **APP LIVE!** |

---

# 📊 VIBE METRICS

## Expected Daily Output
| Role | Min Screens | Tables/RLS | Stores | Components |
|------|-------------|------------|--------|------------|
| Ash | - | 5-7 | - | - |
| Abin | - | - | 2-3 | - |
| Christo | 4-5 | - | - | 2-3 |
| Deon | 4-5 | - | - | 2-3 |

## Total Output (40 days)
- **~160+ screens** (4 members × 4 screens × ~10 days each)
- **~35 database tables** with full RLS
- **~25 Zustand stores**
- **~30 reusable components**

---

# 🔥 VIBE CODER RULES

1. **Ship > Perfect** - Done beats perfect every time
2. **AI First** - Copilot for everything, 10x speed
3. **Copy-paste OK** - Reuse aggressively
4. **No Blockers** - Log issues, move on, fix later
5. **Daily Demos** - Show what you shipped
6. **Async Comms** - No meetings, just chat
7. **Friday = Integration** - Merge everything, test together
8. **Same-day PRs** - Review and merge within hours

---

# 🎯 WEEKLY MILESTONES

| Week | Focus | Screens |
|------|-------|---------|
| 1 | Foundation + Auth + Admin Core | ~50 |
| 2 | Admin Complete + Teacher Core | ~100 |
| 3 | Teacher Complete + Student Core | ~130 |
| 4 | Student Complete | ~160 |
| 5 | Integration + Notifications | Polish |
| 6 | E2E Testing | Tests |
| 7 | UAT + Fixes | Final |
| 8 | Launch! 🚀 | **LIVE** |

---

*Vibe Coders - 8 Weeks to Launch! 🚀*
