# Fee Management Web Application - Specification Document

## Project Overview

A comprehensive web-based fee management system for college administrators to handle all fee-related operations including fee structure creation, manual payment recording (offline payments), student fee tracking, and financial reporting.

**Important Note**: This system does **NOT** process online payments. All payments are collected offline (cash, UPI, bank transfer, etc.) and then recorded manually in the system by authorized staff.

---

## Purpose & Scope

### Primary Purpose
Create a full-featured web application that serves as the **central hub for all fee management operations**, complementing the read-only mobile app.

### Target Users
- **Finance Admins**: Primary users who manage day-to-day fee operations
- **Super Admins**: System administrators with full access
- **Data Entry Operators**: Staff who record payments and update records

### Key Responsibilities
- Create and manage fee structures
- Assign fees to students
- **Record offline payments** (cash, UPI, bank transfer collected manually)
- Track defaulters and overdue payments
- Generate financial reports
- Handle fee waivers and adjustments
- Bulk operations for efficiency

**Payment Collection**: Payments are collected offline by college staff (cashier/reception). The web app is used to **record** these payments, not to process them online.

---

## Technical Stack Recommendations

### Frontend
- **Framework**: React.js (v18+) or Next.js (v14+)
- **UI Library**: Material-UI (MUI) or Ant Design
- **State Management**: Zustand or Redux Toolkit
- **Data Tables**: AG-Grid or TanStack Table (React Table v8)
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **PDF Generation**: jsPDF or react-pdf for receipts

### Backend Integration
- **Database**: Supabase PostgreSQL (existing)
- **Authentication**: Supabase Auth
- **API**: Supabase REST API / Direct SQL queries
- **Real-time**: Supabase Realtime subscriptions (optional)

### Deployment
- **Hosting**: Vercel, Netlify, or AWS Amplify
- **Domain**: Custom domain with SSL
- **CI/CD**: GitHub Actions or Vercel auto-deploy

---

## Core Features & Modules

## 1. Dashboard (Home Screen)

### Overview Cards
Display key metrics at a glance:

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Collection│  Pending Amount │   Today's Fees  │    Defaulters   │
│   ₹45,67,890    │    ₹12,34,560   │    ₹2,45,000    │       127       │
│   ↑ 15% vs last │   ↓ 8% vs last  │    23 payments  │  ⚠️ Action Req. │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Quick Stats Section
- **Collection Rate**: Visual progress bar showing % of fees collected
- **Department-wise Collection**: Pie chart breakdown
- **Monthly Trend**: Line graph of collection over time
- **Payment Methods**: Bar chart (Cash, UPI, Card, Bank Transfer, etc.)

### Recent Activity Feed
- Last 20 payment transactions
- Recent fee structure updates
- New student fee assignments
- System alerts and reminders

### Quick Actions Panel
- ⚡ Record Payment (Quick entry form)
- ➕ Add Fee Structure
- 👤 Assign Fees to Student
- 📊 Generate Report
- 🔔 Send Payment Reminder

---

## 2. Student Fee Management (Main Module)

### Student Fee Table (Primary Interface)

#### Table Features:
- **Advanced Filtering**:
  - Department, Year, Semester, Section
  - Fee status (All, Paid, Partial, Pending, Overdue)
  - Date range filter
  - Amount range filter
  - Custom saved filters

- **Search Functionality**:
  - Student name
  - Admission number
  - Roll number
  - Email/Phone
  - Parent name

- **Column Configuration**:
  ```
  Columns:
  ☑️ Admission No. (sortable, filterable)
  ☑️ Student Name (sortable, searchable, clickable)
  ☑️ Department/Year (filterable)
  ☑️ Fee Structure (filterable)
  ☑️ Total Amount (sortable)
  ☑️ Paid Amount (sortable)
  ☑️ Balance Due (sortable, color-coded)
  ☑️ Status (badge: Paid/Partial/Pending/Overdue)
  ☑️ Due Date (sortable, color-coded if overdue)
  ☑️ Last Payment Date
  ☑️ Actions (View, Pay, Edit, History)
  ```

- **Sorting**: Multi-column sorting
- **Pagination**: 25/50/100/All rows per page
- **Export**: Excel, CSV, PDF
- **Bulk Actions**:
  - Send reminders (email/SMS)
  - Apply discount/waiver
  - Extend due date
  - Generate receipts


#### Table Display Example:
```
┌──────────┬─────────────────┬──────────┬──────────────┬────────┬────────┬─────────┬──────────┬───────────┬──────────┐
│Admission │ Student Name    │ Dept/Yr  │Fee Structure │ Total  │  Paid  │ Balance │  Status  │  Due Date │ Actions  │
├──────────┼─────────────────┼──────────┼──────────────┼────────┼────────┼─────────┼──────────┼───────────┼──────────┤
│CS2023001 │ Rahul Kumar     │ CSE-II   │ Tuition 2024 │ 45,000 │ 45,000 │      0  │ ✅ Paid  │ 15-01-26  │ [👁️📄📜]│
│CS2023002 │ Priya Sharma    │ CSE-II   │ Tuition 2024 │ 45,000 │ 30,000 │ 15,000  │ 🟡 Partial│15-01-26  │ [👁️💰📜]│
│CS2023003 │ Amit Patel      │ CSE-II   │ Tuition 2024 │ 45,000 │      0 │ 45,000  │ 🔴 Overdue│10-01-26  │ [👁️💰📜]│
│ME2023001 │ Neha Singh      │ MECH-I   │ Tuition 2024 │ 42,000 │ 42,000 │      0  │ ✅ Paid  │ 20-01-26  │ [👁️📄📜]│
│...       │ ...             │ ...      │ ...          │ ...    │ ...    │ ...     │ ...      │ ...       │ ...      │
└──────────┴─────────────────┴──────────┴──────────────┴────────┴────────┴─────────┴──────────┴───────────┴──────────┘

[Showing 1-25 of 1,247 students] [Pagination: < 1 2 3 4 ... 50 >] [Export: Excel | CSV | PDF]
```

#### Row Click Action:
Opens **Student Fee Details Modal/Panel** with:

### Student Fee Details Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Student Fee Details - Rahul Kumar (CS2023001)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📋 BASIC INFO                                                    │
│ • Name: Rahul Kumar                                              │
│ • Admission No: CS2023001                                        │
│ • Department: Computer Science Engineering                       │
│ • Year: Second Year    Semester: IV    Section: A               │
│ • Email: rahul.kumar@college.edu    Phone: +91 98765 43210      │
│                                                                  │
│ 💰 FEE SUMMARY                                                   │
│ ┌──────────────────┬──────────────┬──────────────┬─────────────┐│
│ │ Fee Structure    │ Total Amount │ Paid Amount  │ Balance     ││
│ ├──────────────────┼──────────────┼──────────────┼─────────────┤│
│ │ Tuition Fee 2024 │    ₹45,000   │   ₹30,000    │   ₹15,000   ││
│ │ Lab Fee 2024     │    ₹10,000   │   ₹10,000    │       ₹0    ││
│ │ Library Fee      │     ₹2,000   │       ₹0     │    ₹2,000   ││
│ ├──────────────────┼──────────────┼──────────────┼─────────────┤│
│ │ TOTAL            │    ₹57,000   │   ₹40,000    │   ₹17,000   ││
│ └──────────────────┴──────────────┴──────────────┴─────────────┘│
│                                                                  │
│ 📜 PAYMENT HISTORY                                               │
│ ┌────────────┬────────────┬─────────┬──────────────┬──────────┐ │
│ │    Date    │  Amount    │ Method  │   Receipt    │   By     │ │
│ ├────────────┼────────────┼─────────┼──────────────┼──────────┤ │
│ │ 15-Jan-26  │  ₹20,000   │   UPI   │   [Download] │ Admin    │ │
│ │ 10-Jan-26  │  ₹10,000   │   Cash  │   [Download] │ Cashier  │ │
│ │ 05-Jan-26  │  ₹10,000   │   Card  │   [Download] │ Cashier  │ │
│ └────────────┴────────────┴─────────┴──────────────┴──────────┘ │
│                                                                  │
│ 🎯 ACTIONS                                                       │
│ [💰 Record New Payment] [📧 Send Reminder] [📄 Print Receipt]   │
│ [🎫 Generate Hall Ticket] [✏️ Edit Fee] [📜 View Full History]  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Payment Recording Module

**Important**: This module records payments that have already been collected offline. It does NOT process online payments.

### Quick Payment Entry Form

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Record Offline Payment                                    │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Note: Record payments collected offline (cash/UPI/bank)  │
│                                                              │
│ Student Selection:                                           │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔍 Search by Name, Admission No, or Roll No...         │  │
│ └────────────────────────────────────────────────────────┘  │
│ ↓ (Dropdown with suggestions)                                │
│ Selected: Rahul Kumar (CS2023001) - CSE Second Year         │
│                                                              │
│ Outstanding Fees:                                            │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ☑️ Tuition Fee 2024 - Balance: ₹15,000 (Due: 15-Jan)   │  │
│ │ ☐ Library Fee - Balance: ₹2,000 (Due: 20-Jan)          │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Payment Details (Already Collected Offline):                 │
│ Amount Received: [₹ 15,000        ] (Max: ₹17,000)          │
│ Payment Method:  [Cash ▼] (Cash/UPI/Card/Bank Transfer/DD)  │
│ Payment Date:    [28-Jan-2026 📅]                            │
│ Transaction ID:  [TXN123456789   ] (For UPI/Card/Bank)      │
│ Reference:       [SBI UPI Payment] (Optional notes)          │
│ Collected By:    [Cashier 1 ▼]    (Staff who collected)     │
│                                                              │
│ Receipt Options:                                             │
│ ☑️ Generate Receipt                                          │
│ ☑️ Send via Email                                             │
│ ☑️ Print Receipt                                             │
│                                                              │
│ [Cancel] [💾 Record Payment]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Payment Collection Workflow**:
1. Student pays at college cashier/reception (cash, UPI to college account, bank transfer, etc.)
2. Cashier collects payment and provides temporary receipt
3. Cashier logs into web app and records the payment
4. System generates official receipt
5. Receipt is printed/emailed to student

### Bulk Payment Import
- Upload Excel/CSV with offline payment details (already collected)
- Column mapping interface
- Validation and error reporting
- Preview before commit
- Rollback on errors
- Useful for recording multiple offline payments at once

### Payment Receipt Generation
- Auto-generate PDF receipts for recorded payments
- College letterhead and branding
- QR code for verification
- Digital signature
- Email/Print delivery
- Receipt shows payment method used (Cash/UPI/Bank Transfer/DD)

---

## 4. Fee Structure Management

### Fee Structure List

```
┌────────────────────────────────────────────────────────────────┐
│ Fee Structures                                  [+ Create New] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────┬─────────┬──────────┬────────┬──────────┐ │
│ │ Structure Name   │  Type   │  Amount  │  Year  │ Actions  │ │
│ ├──────────────────┼─────────┼──────────┼────────┼──────────┤ │
│ │ Tuition Fee 2024 │ Tuition │ ₹45,000  │ 2024   │ [✏️ 🗑️]  │ │
│ │ Lab Fee 2024     │ Lab     │ ₹10,000  │ 2024   │ [✏️ 🗑️]  │ │
│ │ Library Fee 2024 │ Library │  ₹2,000  │ 2024   │ [✏️ 🗑️]  │ │
│ │ Sports Fee 2024  │ Sports  │  ₹3,000  │ 2024   │ [✏️ 🗑️]  │ │
│ │ Hostel Fee 2024  │ Hostel  │ ₹60,000  │ 2024   │ [✏️ 🗑️]  │ │
│ └──────────────────┴─────────┴──────────┴────────┴──────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Create/Edit Fee Structure Form

```
┌─────────────────────────────────────────────────────────────┐
│ Create Fee Structure                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Structure Name:  [Tuition Fee 2025                        ] │
│ Fee Type:        [Tuition ▼] (Tuition/Lab/Library/etc.)     │
│ Amount:          [₹ 47,000                                ] │
│ Academic Year:   [2025-2026 ▼]                               │
│                                                              │
│ Description:                                                 │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Annual tuition fee for all undergraduate programs      │  │
│ │ Includes classroom instruction, examination fees,      │  │
│ │ and student welfare charges.                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Due Date Configuration:                                      │
│ ☑️ Set Default Due Date: [15-Jan-2026 📅]                    │
│ ☐ Allow Installments                                         │
│   (If checked, show installment configuration)              │
│                                                              │
│ Applicable To:                                               │
│ ☑️ All Departments                                           │
│ ☐ Specific Departments: [Select... ▼]                        │
│                                                              │
│ ☑️ Active (Students can be assigned this fee)                │
│                                                              │
│ [Cancel] [💾 Save Fee Structure]                             │
└─────────────────────────────────────────────────────────────┘
```

### Installment Configuration (if enabled)
```
Number of Installments: [3 ▼]
┌───────────┬──────────┬────────────┐
│ Install # │  Amount  │  Due Date  │
├───────────┼──────────┼────────────┤
│ 1st       │ ₹15,000  │ 15-Jan-26  │
│ 2nd       │ ₹15,000  │ 15-Apr-26  │
│ 3rd       │ ₹17,000  │ 15-Jul-26  │
└───────────┴──────────┴────────────┘
```

---

## 5. Student Fee Assignment

### Assign Fees to Students

#### Individual Assignment
```
┌─────────────────────────────────────────────────────────────┐
│ Assign Fee to Student                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Select Student:                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔍 Search by Name, Admission No...                     │  │
│ └────────────────────────────────────────────────────────┘  │
│ Selected: Rahul Kumar (CS2023001) - CSE-II                  │
│                                                              │
│ Current Fees Assigned:                                       │
│ • Tuition Fee 2024 (₹45,000) - Balance: ₹15,000             │
│ • Lab Fee 2024 (₹10,000) - Paid                              │
│                                                              │
│ Add New Fee:                                                 │
│ Fee Structure: [Select Fee Structure... ▼]                   │
│ Due Date:      [28-Feb-2026 📅]                              │
│ Discount:      [₹ 0          ] (Optional)                    │
│ Remarks:       [Late admission fee waived               ]   │
│                                                              │
│ [Cancel] [➕ Assign Fee]                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Bulk Assignment
```
┌─────────────────────────────────────────────────────────────┐
│ Bulk Fee Assignment                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Step 1: Select Students                                      │
│ Filter By:                                                   │
│ Department: [CSE ▼]  Year: [Second Year ▼]  Semester: [IV ▼]│
│ Section: [All ▼]                                             │
│                                                              │
│ [🔍 Apply Filters] → Shows 127 students                      │
│                                                              │
│ Step 2: Select Fee Structure                                 │
│ Fee Structure: [Exam Fee 2024 ▼] (₹2,000)                   │
│ Due Date: [15-Feb-2026 📅]                                   │
│                                                              │
│ Step 3: Review & Confirm                                     │
│ ⚠️ This will assign "Exam Fee 2024" (₹2,000) to 127 students│
│                                                              │
│ Preview:                                                     │
│ ┌────────────┬──────────────┬─────────┬──────────┐          │
│ │ Adm. No    │ Student Name │  Amount │ Due Date │          │
│ ├────────────┼──────────────┼─────────┼──────────┤          │
│ │ CS2023001  │ Rahul Kumar  │  ₹2,000 │ 15-Feb   │          │
│ │ CS2023002  │ Priya Sharma │  ₹2,000 │ 15-Feb   │          │
│ │ ...        │ ...          │  ...    │ ...      │          │
│ └────────────┴──────────────┴─────────┴──────────┘          │
│ [Showing 5 of 127]                                           │
│                                                              │
│ [Cancel] [⚡ Assign to All 127 Students]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Defaulters Management

### Defaulters Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Fee Defaulters                                [📧 Bulk Send]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Summary:                                                     │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│ │ <7 Days Late │ 7-30 Days    │ 30-90 Days   │ >90 Days   │ │
│ │     23       │     45       │     38       │     21     │ │
│ │ ₹4.5L       │ ₹9.2L        │ ₹8.1L        │ ₹5.3L     │ │
│ └──────────────┴──────────────┴──────────────┴────────────┘ │
│                                                              │
│ Filter: [>30 Days Overdue ▼]  Department: [All ▼]           │
│                                                              │
│ ┌─────┬────────────┬─────────────┬──────┬────────┬────────┐│
│ │ Sel │ Adm. No    │ Student     │ Due  │ Overdue│ Action ││
│ ├─────┼────────────┼─────────────┼──────┼────────┼────────┤│
│ │ ☐   │ CS2023003  │ Amit Patel  │₹45K  │ 18 days│[📧🔔📞]││
│ │ ☐   │ ME2023045  │ Raj Verma   │₹42K  │ 32 days│[📧🔔📞]││
│ │ ☐   │ EC2023012  │ Neha Singh  │₹17K  │ 45 days│[📧🔔📞]││
│ │ ... │ ...        │ ...         │ ...  │ ...    │ ...    ││
│ └─────┴────────────┴─────────────┴──────┴────────┴────────┘│
│                                                              │
│ Bulk Actions:                                                │
│ [☑️ Select All] [📧 Send Email Reminder]                     │
│ [📱 Send SMS] [📞 Generate Call List] [📄 Export Report]     │
└─────────────────────────────────────────────────────────────┘
```

### Reminder Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Send Payment Reminder                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Recipients: 3 students selected                              │
│                                                              │
│ Reminder Type:                                               │
│ ☑️ Email                                                     │
│ ☑️ SMS                                                       │
│ ☐ WhatsApp (if configured)                                   │
│                                                              │
│ Email Template:                                              │
│ Subject: [Payment Reminder - Fee Overdue                 ]  │
│                                                              │
│ Message:                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Dear {student_name},                                   │  │
│ │                                                        │  │
│ │ This is a reminder that your fee payment of           │  │
│ │ ₹{amount_due} was due on {due_date}.                  │  │
│ │                                                        │  │
│ │ Please make the payment at the earliest to avoid      │  │
│ │ any late fees or academic restrictions.               │  │
│ │                                                        │  │
│ │ For queries, contact: finance@college.edu             │  │
│ │                                                        │  │
│ │ Thank you,                                             │  │
│ │ Finance Office                                         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Preview] [Cancel] [📤 Send Reminders]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Reports & Analytics

### Reports Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Financial Reports & Analytics                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Quick Reports:                                               │
│ ┌────────────────────┬────────────────────┬────────────────┐│
│ │ 📊 Collection      │ 👥 Student Fees    │ 💸 Outstanding ││
│ │    Summary         │    Statement       │    Report      ││
│ │ [Generate]         │ [Generate]         │ [Generate]     ││
│ └────────────────────┴────────────────────┴────────────────┘│
│                                                              │
│ Custom Report Generator:                                     │
│                                                              │
│ Report Type: [Fee Collection Report ▼]                       │
│                                                              │
│ Date Range:  [01-Jan-2026 📅] to [28-Jan-2026 📅]            │
│                                                              │
│ Group By:    [☑️ Department] [☑️ Year] [☐ Payment Method]    │
│                                                              │
│ Include:     [☑️ Paid] [☑️ Partial] [☑️ Pending] [☑️ Overdue]│
│                                                              │
│ Format:      [PDF ▼] (PDF/Excel/CSV)                         │
│                                                              │
│ [🔍 Preview Report] [⬇️ Download Report]                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Scheduled Reports:                                           │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ • Daily Collection Summary → finance@college.edu       │  │
│ │ • Weekly Defaulters Report → admin@college.edu         │  │
│ │ • Monthly Financial Report → principal@college.edu     │  │
│ │ [+ Add Scheduled Report]                                │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Available Report Types

1. **Fee Collection Report**
   - Total collection by date range
   - Payment method breakdown
   - Department-wise collection
   - Cashier-wise collection
   - Hourly collection trends

2. **Student Fee Statement**
   - Individual student complete fee history
   - All fees assigned and payment status
   - Outstanding balance
   - Payment receipts attached

3. **Outstanding Fee Report**
   - Department-wise outstanding
   - Year-wise outstanding
   - Aging analysis (0-7, 7-30, 30-90, >90 days)
   - Top defaulters list

4. **Payment Method Analysis**
   - Cash vs Digital payment trends (offline collection)
   - UPI/Card/Bank transfer/DD breakdown
   - Payment collection by cashier/location

5. **Waiver & Discount Report**
   - Total waivers given
   - Category-wise waivers (merit, need-based, etc.)
   - Department distribution

6. **Academic Year Financial Summary**
   - Total fees collected vs target
   - Collection efficiency percentage
   - Month-over-month comparison
   - Forecast for remaining period

---

## 8. Advanced Features

### Fee Waivers & Discounts

```
┌─────────────────────────────────────────────────────────────┐
│ Apply Fee Waiver/Discount                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Student: Rahul Kumar (CS2023001)                             │
│ Current Fee: Tuition Fee 2024 (₹45,000)                     │
│ Amount Paid: ₹30,000                                         │
│ Balance: ₹15,000                                             │
│                                                              │
│ Waiver Type:                                                 │
│ ○ Full Waiver (100%)                                         │
│ ● Partial Waiver                                             │
│ ○ Fixed Amount Discount                                      │
│                                                              │
│ Waiver Amount: [₹ 5,000         ] (Remaining: ₹10,000)      │
│                                                              │
│ Waiver Category: [Merit-based ▼]                             │
│ (Merit/Need-based/Sports/Cultural/Other)                     │
│                                                              │
│ Reason:                                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Student secured 1st rank in university examination     │  │
│ │ and eligible for merit scholarship                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Approved By: [Dr. Principal Name ▼]                          │
│ Approval Date: [28-Jan-2026 📅]                              │
│                                                              │
│ Supporting Document: [📎 Upload Document]                    │
│                                                              │
│ [Cancel] [💾 Apply Waiver]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Due Date Extension

```
┌─────────────────────────────────────────────────────────────┐
│ Extend Payment Due Date                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Student(s): 5 students selected                              │
│                                                              │
│ Current Due Date: 15-Jan-2026                                │
│ New Due Date:     [28-Feb-2026 📅]                           │
│                                                              │
│ Reason for Extension:                                        │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Financial hardship due to family circumstances         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ☑️ Notify students via email                                 │
│ ☐ Apply late fee penalty waiver                              │
│                                                              │
│ [Cancel] [📅 Update Due Date]                                │
└─────────────────────────────────────────────────────────────┘
```

### Refund Management

```
┌─────────────────────────────────────────────────────────────┐
│ Process Fee Refund                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Student: Amit Patel (CS2023003)                              │
│ Total Paid: ₹57,000                                          │
│                                                              │
│ Refund Type:                                                 │
│ ○ Full Refund (Student withdrawal)                           │
│ ● Partial Refund                                             │
│                                                              │
│ Refund Amount: [₹ 20,000 ]                            │
│                                                              │
│ Reason:                                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Overpayment due to scholarship credit not applied     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Refund Method: [Bank Transfer ▼]                             │
│ Account Details:                                             │
│ Account Holder: [Amit Patel                              ]  │
│ Account Number:  [1234567890                             ]  │
│ IFSC Code:       [SBIN0001234                            ]  │
│                                                              │
│ Transaction Date: [28-Jan-2026 📅]                           │
│ Transaction Ref:  [REF123456                             ]  │
│                                                              │
│ Approved By: [Finance Head ▼]                                │
│                                                              │
│ [Cancel] [💸 Process Refund]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Late Fee Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ Late Fee Policy Configuration                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ☑️ Enable Automatic Late Fee Calculation                     │
│                                                              │
│ Late Fee Structure:                                          │
│ ┌────────────────┬────────────────┬──────────────┐          │
│ │ Days Overdue   │ Late Fee Type  │    Amount    │          │
│ ├────────────────┼────────────────┼──────────────┤          │
│ │ 1-7 days       │ Fixed          │  ₹100/day    │          │
│ │ 8-30 days      │ Fixed          │  ₹200/day    │          │
│ │ >30 days       │ % of balance   │  2% per month│          │
│ └────────────────┴────────────────┴──────────────┘          │
│                                                              │
│ Maximum Late Fee Cap: [₹ 5,000     ] (Optional)             │
│                                                              │
│ Grace Period: [3 days ▼] (No late fee for initial days)     │
│                                                              │
│ ☐ Apply late fee retroactively to existing overdue fees     │
│                                                              │
│ [Reset to Default] [💾 Save Policy]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. User Management & Roles

### User Roles

1. **Super Admin**
   - Full access to all modules
   - System configuration
   - User management
   - Audit log access

2. **Finance Admin**
   - Create/edit fee structures
   - Process payments
   - Generate reports
   - Manage defaulters
   - Apply waivers (with approval)

3. **Data Entry Operator**
   - Record payments only
   - View student fee status
   - Generate receipts
   - Limited report access

4. **Finance Head/Accountant**
   - All Finance Admin permissions
   - Approve waivers and refunds
   - Access to all financial reports
   - Export financial data

5. **Read-Only Auditor**
   - View-only access to all data
   - Generate reports
   - Export data
   - No modification permissions

### User Management Interface

```
┌─────────────────────────────────────────────────────────────┐
│ User Management                                 [+ Add User] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────┬────────────────┬─────────────┬──────────┐ │
│ │ Name         │ Email          │ Role        │ Status   │ │
│ ├──────────────┼────────────────┼─────────────┼──────────┤ │
│ │ Admin User   │ admin@col...   │ Super Admin │ ✅ Active│ │
│ │ Finance Mgr  │ finance@co...  │ Finance Adm │ ✅ Active│ │
│ │ Cashier 1    │ cash1@coll...  │ Data Entry  │ ✅ Active│ │
│ │ Cashier 2    │ cash2@coll...  │ Data Entry  │ 🔴 Inact│ │
│ └──────────────┴────────────────┴─────────────┴──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. System Features

### Audit Log & Activity Tracking

Track all operations with:
- User who performed action
- Action type (payment recorded, fee modified, etc.)
- Timestamp
- Before/after values
- IP address and device info

```
┌─────────────────────────────────────────────────────────────┐
│ Audit Log                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Filter: [Last 7 Days ▼] User: [All ▼] Action: [All ▼]       │
│                                                              │
│ ┌────────────┬──────────┬─────────────────┬──────────────┐ │
│ │ Timestamp  │ User     │ Action          │ Details      │ │
│ ├────────────┼──────────┼─────────────────┼──────────────┤ │
│ │ 28-Jan 2PM │ Admin    │ Payment Recorded│ ₹15K CS2003  │ │
│ │ 28-Jan 1PM │ Cashier1 │ Payment Recorded│ ₹20K ME2045  │ │
│ │ 28-Jan 11AM│ Admin    │ Fee Modified    │ CS2003 ext.  │ │
│ │ 27-Jan 4PM │ Finance  │ Waiver Applied  │ ₹5K CS2012   │ │
│ └────────────┴──────────┴─────────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Export & Backup

- **Scheduled Backups**: Daily database exports
- **On-demand Export**: Export any data table to Excel/CSV
- **Bulk Operations Log**: Track all bulk operations
- **Data Integrity Checks**: Automated validation

### Notifications & Alerts

```
🔔 Notifications Center

Recent Alerts:
• ⚠️ 45 students have fees overdue by >30 days
• ✅ Today's collection target achieved (₹2.5L)
• 📊 Weekly report generated and emailed
• 🔴 3 failed payment transactions require attention
• ✅ Monthly backup completed successfully

[Mark All as Read] [Settings]
```

### System Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ System Settings                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🏫 College Information                                       │
│ • College Name: [ABC Engineering College               ]    │
│ • Address: [123 College Road, City                     ]    │
│ • Email: [finance@college.edu                          ]    │
│ • Phone: [+91 1234567890                               ]    │
│                                                              │
│ 💰 Financial Year                                            │
│ • Current Year: [2024-2025 ▼]                                │
│ • Start Date: [01-Apr-2024 📅]                               │
│ • End Date: [31-Mar-2025 📅]                                 │
│                                                              │
│ 📧 Email Configuration                                       │
│ • SMTP Server: [smtp.gmail.com                         ]    │
│ • SMTP Port: [587                                      ]    │
│ • Email: [noreply@college.edu                          ]    │
│ • [Test Email Connection]                                   │
│                                                              │
│ 📱 SMS Configuration                                         │
│ • SMS Provider: [Twilio ▼]                                   │
│ • API Key: [••••••••••••••••••••                       ]    │
│ • [Test SMS]                                                │
│                                                              │
│ 📄 Receipt Configuration                                     │
│ • Logo: [📎 Upload] (college_logo.png)                       │
│ • Authorized Signatory: [Finance Head                  ]    │
│ • Footer Text: [Thank you for your payment            ]    │
│                                                              │
│ [Reset to Default] [💾 Save All Settings]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Integration

### Database Tables Used

```sql
-- Main Tables
• fee_structures       -- Fee structure definitions
• student_fees         -- Individual student fee assignments
• fee_payments         -- Payment records
• students             -- Student information
• users                -- User accounts
• academic_years       -- Academic year configuration

-- Supporting Tables
• user_roles           -- User role assignments
• fee_waivers          -- Waiver records (if implemented)
• fee_reminders        -- Reminder history
• audit_logs           -- Activity tracking
```

### API Endpoints (Supabase Integration)

#### Read Operations
```typescript
// Get all students with fee status
GET /rest/v1/student_fees?select=*,student:students(*,users(*)),fee_structure:fee_structures(*)

// Get fee summary by department
GET /rest/v1/rpc/get_department_fee_summary

// Get defaulters list
GET /rest/v1/rpc/get_fee_defaulters?days_overdue=30
```

#### Write Operations
```typescript
// Create new payment
POST /rest/v1/fee_payments
Body: {
  student_fee_id: "uuid",
  amount: 15000,
  payment_method: "upi",
  payment_date: "2026-01-28",
  transaction_id: "TXN123",
  created_by: "user_id"
}

// Update student fee after payment
PATCH /rest/v1/student_fees?id=eq.uuid
Body: {
  amount_paid: 45000,
  payment_status: "paid"
}

// Create fee structure
POST /rest/v1/fee_structures
Body: {
  name: "Tuition Fee 2025",
  fee_type: "tuition",
  amount: 47000,
  academic_year_id: "uuid",
  description: "..."
}
```

### Database Functions to Create

```sql
-- Get comprehensive student fee summary
CREATE FUNCTION get_student_complete_fee_info(p_student_id UUID)
RETURNS TABLE (
  fee_name TEXT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  balance NUMERIC,
  status TEXT,
  due_date DATE,
  days_overdue INTEGER,
  payment_history JSONB
);

-- Calculate collection summary
CREATE FUNCTION get_collection_summary(
  p_start_date DATE,
  p_end_date DATE,
  p_department_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_collection NUMERIC,
  transaction_count INTEGER,
  payment_method_breakdown JSONB,
  department_breakdown JSONB
);

-- Get top defaulters
CREATE FUNCTION get_top_defaulters(
  p_limit INTEGER DEFAULT 50,
  p_min_amount NUMERIC DEFAULT 0
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  admission_number TEXT,
  total_due NUMERIC,
  days_overdue INTEGER,
  contact_info JSONB
);

-- Bulk fee assignment
CREATE FUNCTION bulk_assign_fees(
  p_student_ids UUID[],
  p_fee_structure_id UUID,
  p_due_date DATE
)
RETURNS INTEGER; -- Returns count of assignments

-- Apply late fees automatically
CREATE FUNCTION apply_late_fees()
RETURNS INTEGER; -- Returns count of students charged

-- This should run as a scheduled task
```

---

## UI/UX Design Guidelines

### Design Principles

1. **Clean & Professional**
   - Minimal design with focus on data
   - Consistent spacing and alignment
   - Professional color scheme (blues, greens for success, reds for alerts)

2. **Data-First Interface**
   - Large, sortable, filterable tables as primary interface
   - Quick access to common actions
   - Minimal clicks to complete tasks

3. **Responsive Design**
   - Works on desktop (primary), tablet, and mobile
   - Touch-friendly buttons and inputs
   - Collapsible sidebars for small screens

4. **Accessibility**
   - Keyboard navigation support
   - Screen reader compatible
   - High contrast mode option
   - Clear error messages

### Color Coding

```
Status Colors:
✅ Paid       → Green (#22c55e)
🟡 Partial    → Yellow/Amber (#f59e0b)
⚪ Pending    → Gray (#6b7280)
🔴 Overdue    → Red (#ef4444)

Alerts:
ℹ️ Info       → Blue (#3b82f6)
⚠️ Warning    → Orange (#f97316)
❌ Error      → Red (#dc2626)
✅ Success    → Green (#10b981)
```

### Typography

```
Headings:    Inter, Roboto, or System UI fonts
Body:        16px base, 1.5 line-height
Tables:      14px for data, monospace for numbers
Buttons:     14px, 600 font-weight, uppercase labels
```

---

## Performance Optimization

### Frontend Optimization
- **Lazy Loading**: Load components on demand
- **Virtual Scrolling**: For large tables (1000+ rows)
- **Debounced Search**: Reduce API calls during typing
- **Cached Queries**: Cache frequently accessed data
- **Pagination**: Limit data fetch to 50-100 rows at a time

### Backend Optimization
- **Database Indexing**: Index frequently queried columns
- **Query Optimization**: Use joins efficiently
- **Connection Pooling**: Reuse database connections
- **Caching Layer**: Redis for frequently accessed data
- **Batch Operations**: Bulk insert/update instead of individual

### Recommended Indexes

```sql
-- Create indexes for better performance
CREATE INDEX idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX idx_student_fees_status ON student_fees(payment_status);
CREATE INDEX idx_student_fees_due_date ON student_fees(due_date);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX idx_fee_payments_student_fee ON fee_payments(student_fee_id);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_students_department ON students(department_id);
```

---

## Security Considerations

### Authentication & Authorization
- **JWT-based Auth**: Supabase Auth tokens
- **Role-based Access**: Enforce at database and API level
- **Row Level Security**: RLS policies in Supabase
- **Session Management**: Auto-logout after inactivity
- **Password Policy**: Strong passwords required

### Data Security
- **Encryption**: HTTPS only, encrypted database
- **Audit Logging**: Track all sensitive operations
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Protection**: Use parameterized queries
- **XSS Protection**: Escape output, CSP headers

### Financial Security
- **Payment Verification**: Double-check before recording offline payments
- **Approval Workflows**: Multi-level approval for refunds/waivers
- **Immutable Records**: Don't allow deletion of payment records (only void with reason)
- **Backup & Recovery**: Regular backups, point-in-time recovery
- **Reconciliation**: Daily reconciliation with physical cash collection and bank deposits
- **Audit Trail**: Track who recorded each payment with timestamp

---

## Implementation Roadmap

### Phase 1: Core Features (4-6 weeks)
1. ✅ Authentication & user management
2. ✅ Student fee table (view, search, filter)
3. ✅ Payment recording (single entry)
4. ✅ Basic receipt generation
5. ✅ Fee structure management (CRUD)
6. ✅ Simple dashboard with key metrics

### Phase 2: Enhanced Features (4-6 weeks)
1. ✅ Bulk fee assignment
2. ✅ Defaulters management with reminders
3. ✅ Advanced filtering and search
4. ✅ Payment history and tracking
5. ✅ Fee waivers and discounts
6. ✅ Due date extensions

### Phase 3: Reports & Analytics (3-4 weeks)
1. ✅ Collection reports (daily/monthly)
2. ✅ Outstanding fee reports
3. ✅ Department-wise analysis
4. ✅ Payment method analytics
5. ✅ Custom report generator
6. ✅ Scheduled reports (email delivery)

### Phase 4: Advanced Features (4-6 weeks)
1. ✅ Bulk payment import (Excel/CSV)
2. ✅ Late fee automation
3. ✅ Refund management
4. ✅ Installment configuration
5. ✅ SMS/Email notifications
6. ✅ Audit logs and activity tracking

### Phase 5: Polish & Optimization (2-3 weeks)
1. ✅ Performance optimization
2. ✅ Mobile responsiveness
3. ✅ User testing and feedback
4. ✅ Bug fixes and refinements
5. ✅ Documentation
6. ✅ Deployment and training

**Total Timeline: 17-25 weeks (4-6 months)**

---

## Deployment Strategy

### Hosting Options

1. **Vercel** (Recommended for Next.js)
   - Easy deployment
   - Auto-scaling
   - CDN included
   - Free tier available

2. **Netlify**
   - Great for React apps
   - CI/CD built-in
   - Edge functions support

3. **AWS Amplify**
   - Full AWS integration
   - Scalable infrastructure
   - Higher cost

### Environment Setup

```bash
# Development
- Local development server
- Supabase local instance (optional)
- Test data

# Staging
- Staging server (Vercel preview)
- Staging database (Supabase project)
- Limited access for testing

# Production
- Production server (Vercel production)
- Production database (Supabase production)
- Full security and monitoring
```

### Continuous Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Training & Documentation

### User Training Materials

1. **Video Tutorials**
   - Dashboard overview (5 min)
   - Recording payments (10 min)
   - Managing defaulters (8 min)
   - Generating reports (12 min)
   - Bulk operations (15 min)

2. **User Manuals**
   - Quick start guide (PDF)
   - Complete user manual (PDF)
   - FAQ document
   - Troubleshooting guide

3. **Live Training Sessions**
   - Finance admin training (2 hours)
   - Data entry operator training (1 hour)
   - Management overview (30 min)

### Technical Documentation

- API documentation
- Database schema
- Deployment guide
- Backup and recovery procedures
- Security best practices

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Operational Efficiency**
   - Average time to record a payment: <2 minutes
   - Bulk payment processing: 100+ entries in <10 minutes
   - Report generation time: <30 seconds
   - System uptime: >99.5%

2. **Financial Metrics**
   - Fee collection rate increase: Target +15%
   - Reduced overdue payments: Target -20%
   - Faster reconciliation: Daily instead of weekly

3. **User Satisfaction**
   - User satisfaction score: >4.5/5
   - Reduced support tickets: -30%
   - Feature adoption rate: >80% of users use advanced features

---

## Support & Maintenance

### Support Channels

1. **In-app Help**
   - Contextual tooltips
   - Help documentation
   - Video tutorials

2. **Email Support**
   - support@collegeapp.com
   - Response time: <24 hours

3. **Phone Support** (Optional)
   - Dedicated support line
   - Business hours support

### Maintenance Plan

- **Daily**: Automated backups, system health checks
- **Weekly**: Performance monitoring, user activity analysis
- **Monthly**: Security updates, feature improvements
- **Quarterly**: Major feature releases, user training

---

## Estimated Costs

### Development Costs (One-time)
- Development team (4-6 months): $15,000 - $30,000
- UI/UX design: $2,000 - $5,000
- Testing and QA: $2,000 - $4,000
- Total: $19,000 - $39,000

### Operational Costs (Monthly)
- Hosting (Vercel/Netlify): $0 - $50
- Database (Supabase): $0 - $25
- Email service (SendGrid): $0 - $20
- SMS service (Twilio): $50 - $200
- Total: $50 - $295/month

**Note**: No payment gateway fees since payments are collected offline

### Optional Services
- Custom domain: $10-20/year
- SSL certificate: Free (Let's Encrypt)
- CDN: Included in hosting
- Monitoring (optional): $29-99/month

---

## Conclusion

This comprehensive fee management web application will:

✅ **Streamline Operations**: Reduce manual work by 60-70%
✅ **Improve Accuracy**: Eliminate data entry errors
✅ **Enhance Visibility**: Real-time dashboards and reports
✅ **Increase Collection**: Better tracking leads to higher collection rates
✅ **Reduce Defaults**: Automated reminders and better follow-up
✅ **Save Time**: Bulk operations and automation
✅ **Better Insights**: Analytics for informed decision-making

The web application will serve as the **central command center** for all fee-related operations, while the mobile app provides convenient read-only access for quick checks and on-the-go viewing.

**Payment Model**: The system records offline payments only. College staff collect payments through cash, UPI to college account, bank transfers, demand drafts, etc., and then record these transactions in the system. There is no online payment gateway integration.

---

## Next Steps

1. **Approve Specification**: Review and approve this document
2. **Select Tech Stack**: Finalize frontend/backend technologies
3. **Design Mockups**: Create detailed UI designs
4. **Set Up Project**: Initialize repository, configure tools
5. **Sprint Planning**: Break down into 2-week sprints
6. **Start Development**: Begin Phase 1 implementation
7. **Iterative Testing**: Test each feature as developed
8. **User Training**: Train staff before production launch
9. **Go Live**: Deploy to production with monitoring
10. **Continuous Improvement**: Gather feedback and iterate

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2026  
**Author**: Development Team  
**Status**: Ready for Review
