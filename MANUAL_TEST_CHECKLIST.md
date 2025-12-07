# Manual UI Testing Checklist for New Features

## Test Date: December 6, 2025
## Tester: _______________

---

## 1. Realtime Analytics Dashboard

### Navigation
- [ ] Navigate to Admin Dashboard
- [ ] Click on "Analytics" menu item
- [ ] Verify analytics screen loads without errors

### Real-time Mode Toggle
- [ ] Verify "Live" toggle is enabled by default (green indicator)
- [ ] Click toggle to switch to "Static" mode
- [ ] Verify indicator changes to gray
- [ ] Switch back to "Live" mode
- [ ] Verify indicator returns to green

### Data Display
- [ ] Verify all stat cards are visible:
  - [ ] Total Students
  - [ ] Total Teachers
  - [ ] Departments
  - [ ] Courses
  - [ ] Pending Approvals
  - [ ] Today's Attendance
  - [ ] Upcoming Exams
  - [ ] Active Assignments
  - [ ] Active Notices
  - [ ] Avg Attendance
  - [ ] Library Books
  - [ ] Data Status (Live)

### Real-time Updates
- [ ] Note current "Last updated" timestamp
- [ ] Wait 30 seconds
- [ ] Verify timestamp updates automatically
- [ ] Click refresh button (↻)
- [ ] Verify data refreshes and timestamp updates

### Data Accuracy (if test data exists)
- [ ] Create a new student record in another window/tab
- [ ] Verify student count updates in analytics (within 30 seconds)
- [ ] Create a new notice
- [ ] Verify active notices count updates
- [ ] Mark student attendance
- [ ] Verify attendance percentage updates

---

## 2. Backup & Restore System

### Navigation
- [ ] Navigate to Settings
- [ ] Click on "Backup & Restore"
- [ ] Verify backup screen loads
- [ ] Verify statistics card shows:
  - [ ] Total Records count
  - [ ] Number of Tables

### Quick Backup
- [ ] Click "Quick Backup" button
- [ ] Verify loading state (button shows "Creating...")
- [ ] Verify success alert appears
- [ ] Verify alert shows:
  - [ ] File size (KB)
  - [ ] Number of tables
  - [ ] Total records
  - [ ] Time taken

### Export & Share Backup
- [ ] Click "Export & Share" button
- [ ] Verify loading state
- [ ] Verify sharing dialog appears
- [ ] Select a sharing option (e.g., save to files)
- [ ] Verify file is saved/shared successfully
- [ ] Check saved file is valid JSON

### Saved Backups List
- [ ] Verify "Saved Backups" section appears (if backups exist)
- [ ] Verify backup files are listed with timestamps
- [ ] Note number of backups shown: ___________

### Delete Backup
- [ ] Click trash icon on a backup file
- [ ] Verify confirmation dialog appears
- [ ] Cancel deletion
- [ ] Verify file still exists
- [ ] Click trash icon again
- [ ] Confirm deletion
- [ ] Verify file is removed from list

### Import from File
- [ ] Click "Import from File" button
- [ ] Verify file picker opens
- [ ] Select a valid backup JSON file
- [ ] Verify restore confirmation dialog shows:
  - [ ] Number of records
  - [ ] Number of tables
  - [ ] Backup date/time
  - [ ] Warning message
- [ ] Cancel restore
- [ ] Verify no changes made

### Paste JSON Restore
- [ ] Click "Paste JSON" button
- [ ] Verify text input area appears
- [ ] Paste invalid JSON (e.g., "test")
- [ ] Click "Restore Now"
- [ ] Verify error message appears
- [ ] Clear input and click "Cancel"
- [ ] Verify input area closes

### Scheduled Backups
- [ ] Click "Daily" schedule button
- [ ] Verify alert about future implementation
- [ ] Click "Weekly" schedule button
- [ ] Verify alert appears
- [ ] Click "Monthly" schedule button
- [ ] Verify alert appears

### Table Statistics
- [ ] Scroll to "Table Statistics" section
- [ ] Verify all tables are listed
- [ ] Verify each table shows record count
- [ ] Verify total matches statistics card

### Refresh Functionality
- [ ] Click refresh button (↻) in header
- [ ] Verify loading state
- [ ] Verify statistics update
- [ ] Verify backup list updates

---

## 3. Error Handling

### Analytics Errors
- [ ] Disconnect internet
- [ ] Reload analytics page
- [ ] Verify graceful error handling (zeros or default values)
- [ ] Reconnect internet
- [ ] Verify data loads correctly

### Backup Errors
- [ ] Try to create backup with no permissions (if applicable)
- [ ] Verify appropriate error message
- [ ] Try to restore invalid JSON
- [ ] Verify validation error message

---

## 4. Performance Testing

### Analytics Loading
- [ ] Time initial load: _________ seconds
- [ ] Verify load time is acceptable (< 3 seconds)

### Backup Creation
- [ ] Time backup creation: _________ seconds
- [ ] Verify backup time is acceptable (< 5 seconds for small datasets)

### Restore Operation
- [ ] Time restore operation: _________ seconds
- [ ] Verify restore time is acceptable

---

## 5. Cross-Platform Testing (if applicable)

### iOS
- [ ] Test all features on iOS simulator/device
- [ ] Note any platform-specific issues: __________________

### Android
- [ ] Test all features on Android emulator/device
- [ ] Note any platform-specific issues: __________________

### Web (if applicable)
- [ ] Test all features on web browser
- [ ] Note any platform-specific issues: __________________

---

## Issues Found

### Issue 1
- **Description**: _________________________________________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Steps to Reproduce**: __________________________________
- **Expected Result**: _____________________________________
- **Actual Result**: _______________________________________

### Issue 2
- **Description**: _________________________________________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Steps to Reproduce**: __________________________________
- **Expected Result**: _____________________________________
- **Actual Result**: _______________________________________

### Issue 3
- **Description**: _________________________________________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Steps to Reproduce**: __________________________________
- **Expected Result**: _____________________________________
- **Actual Result**: _______________________________________

---

## Overall Assessment

### Features Working Correctly
- [ ] Realtime Analytics Dashboard
- [ ] Backup Creation (Quick)
- [ ] Backup Creation (Export & Share)
- [ ] Backup File Management
- [ ] Restore from File
- [ ] Restore from JSON
- [ ] Statistics Display
- [ ] Error Handling

### Features Needing Attention
- _____________________________________________________
- _____________________________________________________
- _____________________________________________________

### Recommendations
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Sign-off

**Tester Name**: _______________________
**Date**: _______________________
**Status**: [ ] Approved [ ] Approved with Notes [ ] Rejected

**Notes**: _______________________________________________
_________________________________________________________
_________________________________________________________
