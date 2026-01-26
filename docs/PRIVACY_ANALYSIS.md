# Privacy Analysis - JPM College App

**Analysis Date:** January 25, 2026  
**App Version:** Expo SDK 53 / React Native  
**Backend:** Supabase (PostgreSQL)

---

## Executive Summary

The app handles sensitive educational and personal data for students, teachers, and staff. While many security best practices are implemented (RLS, input sanitization, encrypted Aadhar), there are critical gaps in privacy compliance that need addressing before production deployment.

**Privacy Health Score: 6.5/10**

---

## 1. Current Privacy Implementation

### 1.1 ✅ What's Working Well

| Feature | Implementation | Status |
|---------|----------------|--------|
| **Row Level Security (RLS)** | Enabled on all sensitive tables | ✅ Strong |
| **Input Sanitization** | `lib/sanitization.ts` - XSS, SQL injection protection | ✅ Comprehensive |
| **Role-Based Access Control** | 14 roles, 30+ permissions in `lib/rbac.ts` | ✅ Granular |
| **Aadhar Encryption** | Database-level encryption on `aadhar_number` column | ✅ Implemented |
| **HTTPS Transport** | All Supabase API calls over HTTPS | ✅ Enforced |
| **Analytics Opt-Out** | Toggle in student settings | ✅ Available |
| **Service Key Protection** | Leak detection in `lib/supabase.ts` | ✅ Implemented |
| **Password Validation** | Minimum 8 characters enforced | ✅ Basic |
| **SECURITY DEFINER Functions** | Sensitive operations use controlled context | ✅ Applied |

### 1.2 ⚠️ Partial Implementations

| Feature | Current State | Gap |
|---------|---------------|-----|
| **Data Saver Mode** | Toggle exists | Only affects images, not core data |
| **Session Timeout** | Auto-refresh enabled | No configurable inactivity timeout |

### 1.3 ❌ Missing Privacy Features

| Feature | Risk Level | Notes |
|---------|------------|-------|
| **SecureStore for Tokens** | 🔴 Critical | Auth tokens stored in unencrypted AsyncStorage |
| **Privacy Policy Document** | 🔴 Critical | No policy displayed to users |
| **Terms of Service** | 🔴 Critical | No ToS document |
| **Consent Mechanism** | 🔴 Critical | No checkbox during registration |
| **Data Retention Policy** | 🟠 High | Data kept indefinitely |
| **Data Export (DSAR)** | 🟠 High | Users cannot download their data |
| **Account Deletion** | 🟠 High | No self-service deletion option |
| **Cookie Consent (Web)** | 🟡 Medium | Web version needs consent banner |
| **Audit Trail for Data Access** | 🟡 Medium | No logging of who viewed what |

---

## 2. Personal Data Inventory

### 2.1 Data Collected During Registration

| Data Field | Purpose | Sensitivity | Retention |
|------------|---------|-------------|-----------|
| Full Name | Identification | Medium | Indefinite |
| Email | Login, Communication | Medium | Indefinite |
| Phone Number | Communication, Verification | High | Indefinite |
| Date of Birth | Age verification, Records | High | Indefinite |
| Gender | Demographics | Medium | Indefinite |
| APAAR ID | National Educational ID | 🔴 Very High | Indefinite |
| Password (hashed) | Authentication | High | Until changed |
| Roll Number | Academic identification | Low | Indefinite |
| Admission Number | Official records | Medium | Indefinite |

### 2.2 Additional Data in Student Profile

| Data Field | Purpose | Sensitivity | Stored Where |
|------------|---------|-------------|--------------|
| Aadhar Number | Government ID verification | 🔴 Very High | Encrypted in DB |
| Parent Names | Guardian information | High | `students` table |
| Parent Phone | Emergency contact | High | `students` table |
| Parent Email | Communication | Medium | `students` table |
| Full Address | Records | High | `profiles` table |
| Blood Group | Medical emergency | Medium | `students` table |
| Social Category | Reservation quotas | High | `students` table |
| Photo | Identification | Medium | Supabase Storage (public) |

### 2.3 Sensitive Academic Data

| Data Type | Access Level | RLS Protected |
|-----------|--------------|---------------|
| Attendance Records | Student (own), Teacher (class), Admin (all) | ✅ Yes |
| Exam Marks/Grades | Student (own), Teacher (subject), Admin (all) | ✅ Yes |
| Assignments | Student (own class), Teacher (own), Admin (all) | ✅ Yes |
| Fee Payment Status | Student (own), Finance Admin | ✅ Yes |
| Disciplinary Records | Admin only | ✅ Yes |
| Library History | Student (own), Library Admin | ✅ Yes |

---

## 3. Data Storage Analysis

### 3.1 Local Storage (Mobile Device)

| Data Type | Storage Method | Encrypted | Risk |
|-----------|----------------|-----------|------|
| Auth Session Token | AsyncStorage | ❌ No | 🔴 Critical |
| Refresh Token | AsyncStorage | ❌ No | 🔴 Critical |
| User Preferences | AsyncStorage | ❌ No | 🟢 Low |
| Theme Settings | AsyncStorage | ❌ No | 🟢 Low |
| Dashboard Cache | AsyncStorage (2 min TTL) | ❌ No | 🟡 Medium |
| Last Login Role | AsyncStorage | ❌ No | 🟢 Low |

### 3.2 Cloud Storage (Supabase)

| Bucket | Access | Content |
|--------|--------|---------|
| `avatars` | Public Read | Profile photos - **⚠️ Publicly accessible URLs** |
| `hall_ticket_photos` | Public Read | Hall ticket photos - **⚠️ Publicly accessible URLs** |
| `teaching-materials` | Authenticated | Course materials |
| `documents` | Authenticated | Official documents |
| `assignments` | Authenticated | Student submissions |

---

## 4. Data Transmission Security

### 4.1 API Security

| Aspect | Implementation | Notes |
|--------|----------------|-------|
| Transport Layer | TLS 1.2+ (Supabase managed) | ✅ Enforced |
| API Keys | Anon key client-side (safe) | ✅ Correct |
| Service Role Key | Server-only with leak detection | ✅ Protected |
| Request Signing | Supabase JWT authentication | ✅ Automatic |

### 4.2 Input Validation & Sanitization

```
lib/sanitization.ts exports:
├── sanitizeHtml()        - Removes script tags, event handlers
├── sanitizePlainText()   - Strips all HTML
├── sanitizeEmail()       - Validates format, normalizes
├── sanitizePhone()       - Strips non-digits except +
├── sanitizeAlphanumeric() - Letters, numbers, spaces only
├── sanitizeSqlString()   - Removes SQL injection patterns
├── sanitizeUrl()         - Blocks javascript:, data: protocols
├── sanitizeFilePath()    - Prevents path traversal
└── sanitizeFormData()    - Applies field-specific sanitization
```

---

## 5. Access Control Matrix

### 5.1 Who Can Access What Data

| Data Type | Student | Teacher | Receptionist | Admin |
|-----------|---------|---------|--------------|-------|
| Own Profile | ✅ Full | ✅ Full | ❌ | ✅ Full |
| Other Profiles | ❌ | 🔶 Name Only | 🔶 Limited | ✅ Full |
| Own Attendance | ✅ View | N/A | ❌ | ✅ Full |
| Class Attendance | ❌ | ✅ Mark & View | ❌ | ✅ Full |
| All Attendance | ❌ | ❌ | ❌ | ✅ Full |
| Own Grades | ✅ View | N/A | ❌ | ✅ Full |
| Class Grades | ❌ | ✅ Subject Only | ❌ | ✅ Full |
| Fee Status | ✅ Own | ❌ | ❌ | ✅ Finance |

### 5.2 Receptionist Current Permissions

From `reception_module.sql`:
- `reception_view_approved_gate_passes` - View approved gate passes
- `reception_mark_gate_pass_exit` - Mark student exit
- `reception_issue_late_pass` - Issue late arrival passes
- `reception_view_todays_logs` - View daily entry/exit logs
- `reception_view_notices` - View campus notices

**❌ Receptionist CANNOT currently view attendance records**

---

## 6. Compliance Gap Analysis

### 6.1 India's Digital Personal Data Protection Act (DPDPA) 2023

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Lawful purpose for processing | ⚠️ Implied | Document explicit purposes |
| Notice to data principal | ❌ Missing | Add privacy policy |
| Consent before processing | ❌ Missing | Add consent checkbox |
| Purpose limitation | ⚠️ Partial | Define and limit purposes |
| Data minimization | ⚠️ Partial | Review necessity of each field |
| Storage limitation | ❌ Missing | Define retention periods |
| Right to correction | ✅ Profile edit exists | - |
| Right to erasure | ❌ Missing | Add account deletion |
| Grievance redressal | ❌ Missing | Add contact mechanism |
| Security safeguards | ⚠️ Partial | Add SecureStore for tokens |

### 6.2 GDPR (If serving EU users)

| Requirement | Status | Priority |
|-------------|--------|----------|
| Privacy by Design | ⚠️ Partial | Medium |
| Data Protection Impact Assessment | ❌ Missing | High |
| Lawful basis documentation | ❌ Missing | High |
| Data subject rights | ❌ Missing | High |
| Records of processing | ❌ Missing | Medium |
| Breach notification process | ❌ Missing | High |

---

## 7. Recommended Privacy Roadmap

### Phase 1: Critical (Before Launch) 🔴

| # | Task | Effort | Impact |
|---|------|--------|--------|
| P1 | Migrate auth tokens to `expo-secure-store` | 2 days | Critical |
| P2 | Create and display Privacy Policy | 1 day | Legal |
| P3 | Add consent checkbox to registration | 0.5 day | Legal |
| P4 | Create Terms of Service | 1 day | Legal |
| P5 | Make profile photo buckets private | 0.5 day | High |

### Phase 2: High Priority (Month 1) 🟠

| # | Task | Effort | Impact |
|---|------|--------|--------|
| P6 | Implement account deletion flow | 3 days | DPDPA |
| P7 | Add data export feature (DSAR) | 2 days | DPDPA |
| P8 | Define data retention periods | 1 day | Compliance |
| P9 | Implement session inactivity timeout | 1 day | Security |
| P10 | Add audit logging for data access | 3 days | Security |

### Phase 3: Enhancements (Month 2-3) 🟡

| # | Task | Effort | Impact |
|---|------|--------|--------|
| P11 | Add cookie consent for web | 1 day | Compliance |
| P12 | Encrypt local cache data | 2 days | Security |
| P13 | Implement password rotation policy | 1 day | Security |
| P14 | Add two-factor authentication | 4 days | Security |

---

## 8. Privacy Policy Template Outline

```markdown
# Privacy Policy - JPM College App

1. Information We Collect
   - Registration data (name, email, phone, DOB, etc.)
   - Academic data (attendance, grades, assignments)
   - Usage data (app analytics - optional)

2. How We Use Your Information
   - Educational administration
   - Communication with students/parents
   - Academic performance tracking

3. Data Sharing
   - Within institution (teachers, admins)
   - With government (APAAR integration)
   - Never sold to third parties

4. Data Security
   - Encryption in transit and at rest
   - Role-based access control
   - Regular security audits

5. Your Rights
   - Access your data
   - Correct inaccuracies
   - Request deletion
   - Withdraw consent

6. Data Retention
   - Active student data: Duration of enrollment + 7 years
   - Alumni data: Limited to verification needs

7. Contact Us
   - Data Protection Officer: [email]
   - Grievance: [mechanism]
```

---

## 9. Summary Metrics

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Legal Documents | 0 | 3 | 3 documents |
| Consent Mechanisms | 0 | 2 | 2 flows |
| Secure Storage | 0% | 100% | SecureStore migration |
| User Data Rights | 1 | 4 | 3 features |
| Audit Coverage | 0% | 80% | Logging system |

**Next Steps:**
1. Review this analysis with stakeholders
2. Prioritize Phase 1 tasks for immediate implementation
3. Create privacy policy draft for legal review
4. Plan SecureStore migration

---

*Document prepared as part of codebase analysis. Last updated: Jan 25, 2026*
