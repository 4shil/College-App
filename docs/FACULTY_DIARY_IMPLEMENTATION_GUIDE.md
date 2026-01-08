# Faculty Work Diary - Developer Implementation Guide

**Date:** 2026-01-08  
**Audience:** React Native / TypeScript Developers  
**Status:** Implementation Ready

**Scope:** This guide covers the **Faculty Work Diary** system which tracks teacher workload across 6 units over a monthly period. This is distinct from the Lesson Planner (which is weekly topic planning).

---

## Quick Start Overview

The Faculty Diary system has 4 main components to implement:

1. **Daily Entry Component** - Teacher enters timetable + task hours
2. **Blocking Logic** - Holiday/Leave rows are locked
3. **Monthly Summary & Approval** - HOD/Principal approval flow
4. **Analytics & Reporting** - View past submissions + workload trends

---

## Architecture

### Data Flow

```
Teacher creates diary entry
  ↓
Daily Entry Form (filled)
  ↓
Save to work_diary.daily_entries (JSONB)
  ↓
Auto-sync to work_diary_daily_entries (normalized table)
  ↓
Calculate summary (work_diary_summaries)
  ↓
Teacher submits monthly (status → 'submitted')
  ↓
HOD reviews → Approves/Rejects
  ↓
Principal reviews → Final approval/Rejection
```

### Database Tables Structure

```typescript
// Main entry (already exists)
work_diaries: {
  id: UUID,
  teacher_id: UUID,
  month: number,
  year: number,
  daily_entries: JSONB,  // [{date, status, periods, tasks}]
  status: 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected'
}

// New summaries table
work_diary_summaries: {
  work_diary_id: UUID (FK),
  unit_i_pg_count: number,      // Total M_ codes
  unit_i_ug_count: number,      // Total D_ codes
  unit_ii_total_hours: number,  // Tutorial sum
  unit_iii_total_hours: number, // Exam sum
  // ... (IV, V, VI)
  teacher_certified_at: timestamp,
  hod_reviewed_at: timestamp,
  principal_reviewed_at: timestamp
}

// New normalized daily entries
work_diary_daily_entries: {
  work_diary_id: UUID,
  entry_date: DATE,
  day_status: 'W' | 'H' | 'L',
  spl_class_am: string,  // D_1, M_2, null
  period_i: string,
  period_ii: string,
  // ... periods III-V
  spl_class_eve: string,
  total_pg_classes: number,      // Auto-calculated
  total_ug_classes: number,      // Auto-calculated
  unit_ii_hours: number,
  unit_iii_hours: number,
  // ... (IV, V, VI)
}

// Audit trail
work_diary_audit_log: {
  work_diary_id: UUID,
  changed_by: UUID (profile.id),
  change_type: 'submitted' | 'hod_approved' | 'rejected' | ...
  old_status: string,
  new_status: string,
  rejection_reason?: string,
  changed_at: timestamp
}
```

---

## Phase 1: Daily Entry Form Component

### Component Structure

```typescript
// app/(teacher)/diary/create.tsx

import React, { useState } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface DailyEntry {
  date: string;
  day_status: 'W' | 'H' | 'L';
  remarks: string;
  periods: {
    slot: string; // 'spl_am', 'p1', 'p2', 'p3', 'p4', 'p5', 'spl_eve'
    class_code: string | null; // 'D_1', 'M_2', etc.
  }[];
  tasks: {
    unit_ii_hours: number;
    unit_iii_hours: number;
    unit_iv_hours: number;
    unit_v_hours: number;
    unit_vi_hours: number;
  };
}

export default function CreateDiaryEntry() {
  const { user } = useAuth();
  const [entry, setEntry] = useState<DailyEntry>({
    date: new Date().toISOString().split('T')[0],
    day_status: 'W',
    remarks: '',
    periods: [
      { slot: 'spl_am', class_code: null },
      { slot: 'p1', class_code: null },
      { slot: 'p2', class_code: null },
      { slot: 'p3', class_code: null },
      { slot: 'p4', class_code: null },
      { slot: 'p5', class_code: null },
      { slot: 'spl_eve', class_code: null },
    ],
    tasks: {
      unit_ii_hours: 0,
      unit_iii_hours: 0,
      unit_iv_hours: 0,
      unit_v_hours: 0,
      unit_vi_hours: 0,
    },
  });

  // Calculate totals dynamically
  const getTotals = () => {
    const pgCount = entry.periods.filter((p) => p.class_code?.startsWith('M_')).length;
    const ugCount = entry.periods.filter((p) => p.class_code?.startsWith('D_')).length;
    return { pgCount, ugCount };
  };

  const isRowLocked = entry.day_status !== 'W';

  const handleClassCodeChange = (slot: string, code: string | null) => {
    setEntry((prev) => ({
      ...prev,
      periods: prev.periods.map((p) =>
        p.slot === slot ? { ...p, class_code: code } : p
      ),
    }));
  };

  const handleTaskHoursChange = (unit: keyof DailyEntry['tasks'], hours: number) => {
    // Validate: 0-5 hours
    if (hours < 0 || hours > 5) {
      Alert.alert('Invalid Input', 'Hours must be between 0 and 5');
      return;
    }
    setEntry((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [unit]: hours },
    }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!entry.date) {
        Alert.alert('Error', 'Date is required');
        return;
      }

      // TODO: Save to database
      // This will be expanded in Phase 3 (Integration)

      Alert.alert('Success', 'Entry saved to draft');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* DATE & STATUS SECTION */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-bold mb-3">Daily Entry</Text>

        {/* Date Picker */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Date</Text>
          <Text className="text-base text-gray-900 bg-gray-50 p-3 rounded">
            {new Date(entry.date).toLocaleDateString()} ({getDayName(new Date(entry.date))})
          </Text>
        </View>

        {/* Day Status Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Status</Text>
          <View className="flex-row gap-2">
            {['W', 'H', 'L'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setEntry((prev) => ({ ...prev, day_status: status as any }))}
                className={`flex-1 py-2 rounded ${
                  entry.day_status === status
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  entry.day_status === status ? 'text-white' : 'text-gray-700'
                }`}>
                  {status === 'W' ? 'Working' : status === 'H' ? 'Holiday' : 'Leave'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Remarks */}
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-1">Remarks</Text>
          <TextInput
            placeholder="Holiday name, leave reason, or notes"
            value={entry.remarks}
            onChangeText={(text) => setEntry((prev) => ({ ...prev, remarks: text }))}
            className="border border-gray-300 rounded p-2"
            editable={!isRowLocked}
          />
        </View>
      </View>

      {/* UNIT I - TIMETABLE SECTION */}
      {!isRowLocked && (
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold mb-3">Unit I - Lecture/Practical</Text>

          {/* Render each period */}
          {entry.periods.map((period) => (
            <ClassCodeSelector
              key={period.slot}
              slot={period.slot}
              value={period.class_code}
              onChange={(code) => handleClassCodeChange(period.slot, code)}
            />
          ))}

          {/* Summary Display */}
          <View className="mt-4 p-3 bg-blue-50 rounded">
            <Text className="text-sm font-semibold text-gray-700">Daily Summary</Text>
            <Text className="text-base text-gray-900 mt-1">
              Total PG: <Text className="font-bold">{getTotals().pgCount}</Text> | Total UG: <Text className="font-bold">{getTotals().ugCount}</Text>
            </Text>
          </View>
        </View>
      )}

      {/* UNITS II-VI - TASK HOURS SECTION */}
      {!isRowLocked && (
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold mb-3">Units II-VI - Task Hours</Text>

          {[
            { unit: 'unit_ii_hours', label: 'Tutorial (Unit II)', icon: '👥' },
            { unit: 'unit_iii_hours', label: 'Examination (Unit III)', icon: '📝' },
            { unit: 'unit_iv_hours', label: 'Research (Unit IV)', icon: '🔬' },
            { unit: 'unit_v_hours', label: 'Preparation (Unit V)', icon: '📚' },
            { unit: 'unit_vi_hours', label: 'Extension (Unit VI)', icon: '📋' },
          ].map(({ unit, label, icon }) => (
            <View key={unit} className="mb-4 p-3 bg-gray-50 rounded">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                {icon} {label}
              </Text>
              <HoursStepper
                value={entry.tasks[unit as keyof DailyEntry['tasks']]}
                onChange={(hours) =>
                  handleTaskHoursChange(unit as keyof DailyEntry['tasks'], hours)
                }
              />
              <Text className="text-xs text-gray-500 mt-1">Max: 5 hours/day</Text>
            </View>
          ))}
        </View>
      )}

      {/* LOCKED STATE MESSAGE */}
      {isRowLocked && (
        <View className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <Text className="text-sm font-semibold text-yellow-800">
            ⚠️ {entry.day_status === 'H' ? 'Holiday' : 'Leave'} - Row Locked
          </Text>
          <Text className="text-xs text-yellow-700 mt-1">
            No entries can be added on {entry.remarks || (entry.day_status === 'H' ? 'holidays' : 'leave days')}.
          </Text>
        </View>
      )}

      {/* ACTIONS */}
      <View className="p-4 gap-2">
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-500 rounded py-3"
        >
          <Text className="text-white text-center font-bold">Save Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-gray-200 rounded py-3">
          <Text className="text-gray-700 text-center font-bold">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper component for class code selector
function ClassCodeSelector({
  slot,
  value,
  onChange,
}: {
  slot: string;
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  const slotLabels: Record<string, string> = {
    spl_am: 'Special (AM)',
    p1: 'Period I',
    p2: 'Period II',
    p3: 'Period III',
    p4: 'Period IV',
    p5: 'Period V',
    spl_eve: 'Special (EVE)',
  };

  const classCodes = [
    'D_1', 'D_2', 'D_3', 'D_4', 'D_5', 'D_6',
    'M_1', 'M_2', 'M_3', 'M_4',
  ];

  return (
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">{slotLabels[slot]}</Text>
      <Picker
        selectedValue={value}
        onValueChange={(code) => onChange(code === '' ? null : code)}
        style={{ height: 50, backgroundColor: '#f3f4f6' }}
      >
        <Picker.Item label="-- No Class --" value="" />
        {classCodes.map((code) => (
          <Picker.Item key={code} label={code} value={code} />
        ))}
      </Picker>
    </View>
  );
}

// Helper component for hours stepper
function HoursStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (hours: number) => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        onPress={() => onChange(Math.max(0, value - 0.5))}
        className="bg-gray-300 w-10 h-10 rounded justify-center items-center"
      >
        <Text className="text-lg font-bold">−</Text>
      </TouchableOpacity>
      <TextInput
        value={value.toString()}
        onChangeText={(text) => {
          const num = parseFloat(text) || 0;
          onChange(Math.min(5, Math.max(0, num)));
        }}
        className="flex-1 text-center border border-gray-300 rounded py-2"
        keyboardType="decimal-pad"
      />
      <TouchableOpacity
        onPress={() => onChange(Math.min(5, value + 0.5))}
        className="bg-blue-500 w-10 h-10 rounded justify-center items-center"
      >
        <Text className="text-lg font-bold text-white">+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Helper function
function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}
```

### Key Features

✅ Timetable entry with class codes (D_x, M_x)  
✅ Auto-calculate Total PG/UG from class codes  
✅ Task hours stepper (0-5) for Units II-VI  
✅ Status toggle (W/H/L)  
✅ Blocking logic for Holiday/Leave rows  
✅ Remarks field for context  
✅ Real-time validation  

---

## Phase 2: Monthly Summary & Auto-Calculation

### Summary Calculation Function

```typescript
// lib/diaryCalculations.ts

interface DailyEntryData {
  date: string;
  day_status: 'W' | 'H' | 'L';
  periods: Array<{ slot: string; class_code: string | null }>;
  tasks: {
    unit_ii_hours: number;
    unit_iii_hours: number;
    unit_iv_hours: number;
    unit_v_hours: number;
    unit_vi_hours: number;
  };
}

export function calculateMonthlySummary(dailyEntries: DailyEntryData[]) {
  let pgCount = 0;
  let ugCount = 0;
  let unit2Total = 0;
  let unit3Total = 0;
  let unit4Total = 0;
  let unit5Total = 0;
  let unit6Total = 0;
  let daysPresent = 0;

  dailyEntries.forEach((entry) => {
    // Count Unit I classes
    entry.periods.forEach((p) => {
      if (p.class_code?.startsWith('M_')) pgCount++;
      if (p.class_code?.startsWith('D_')) ugCount++;
    });

    // Sum task hours
    unit2Total += entry.tasks.unit_ii_hours;
    unit3Total += entry.tasks.unit_iii_hours;
    unit4Total += entry.tasks.unit_iv_hours;
    unit5Total += entry.tasks.unit_v_hours;
    unit6Total += entry.tasks.unit_vi_hours;

    // Count working days
    if (entry.day_status === 'W') daysPresent++;
  });

  return {
    unit_i_pg_count: pgCount,
    unit_i_ug_count: ugCount,
    unit_ii_total_hours: unit2Total,
    unit_iii_total_hours: unit3Total,
    unit_iv_total_hours: unit4Total,
    unit_v_total_hours: unit5Total,
    unit_vi_total_hours: unit6Total,
    days_present: daysPresent,
    // Calculate averages
    unit_ii_avg_daily: unit2Total / daysPresent || 0,
    unit_iii_avg_daily: unit3Total / daysPresent || 0,
    unit_iv_avg_daily: unit4Total / daysPresent || 0,
    unit_v_avg_daily: unit5Total / daysPresent || 0,
    unit_vi_avg_daily: unit6Total / daysPresent || 0,
  };
}

export function validateDiaryCompletion(dailyEntries: DailyEntryData[], month: number, year: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const entriesProvided = dailyEntries.length;

  if (entriesProvided < daysInMonth) {
    return {
      isComplete: false,
      missingDays: daysInMonth - entriesProvided,
      message: `${daysInMonth - entriesProvided} days still need to be filled`,
    };
  }

  return {
    isComplete: true,
    missingDays: 0,
    message: 'All days have entries',
  };
}
```

### Monthly Summary Component

```typescript
// app/(teacher)/diary/summary.tsx

export default function DiarySummary() {
  const { diaryId, month, year } = useRoute().params;
  const [diary, setDiary] = useState<WorkDiary | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [dutyLeave, setDutyLeave] = useState(0);
  const [otherLeave, setOtherLeave] = useState(0);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    // Fetch work_diary from Supabase
    const { data, error } = await supabase
      .from('work_diaries')
      .select('*')
      .eq('id', diaryId)
      .single();

    if (data) {
      setDiary(data);
      const calc = calculateMonthlySummary(data.daily_entries || []);
      setSummary(calc);
    }
  };

  const handleSubmit = async () => {
    try {
      // Update work_diary status to 'submitted'
      const { error } = await supabase
        .from('work_diaries')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', diaryId);

      if (error) throw error;

      // Log to audit trail
      await supabase.from('work_diary_audit_log').insert({
        work_diary_id: diaryId,
        changed_by: user.id,
        change_type: 'submitted',
        new_status: 'submitted',
      });

      Alert.alert('Success', 'Diary submitted for HOD approval');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit diary');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-2">
          Monthly Summary - {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        {/* ATTENDANCE SUMMARY */}
        <View className="mb-6 p-4 bg-gray-50 rounded">
          <Text className="text-lg font-bold mb-3">Attendance Summary</Text>
          
          <View className="mb-3">
            <Text className="text-sm text-gray-600 mb-1">Days on Duty Leave / OD</Text>
            <TextInput
              value={dutyLeave.toString()}
              onChangeText={(text) => setDutyLeave(parseInt(text) || 0)}
              keyboardType="number-pad"
              className="border border-gray-300 rounded p-2 text-base"
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-600 mb-1">Days on Other Leave</Text>
            <TextInput
              value={otherLeave.toString()}
              onChangeText={(text) => setOtherLeave(parseInt(text) || 0)}
              keyboardType="number-pad"
              className="border border-gray-300 rounded p-2 text-base"
            />
          </View>

          <View className="p-3 bg-white rounded">
            <Text className="text-sm text-gray-600">Total Days Present</Text>
            <Text className="text-2xl font-bold text-blue-600 mt-1">
              {summary?.days_present || 0}
            </Text>
          </View>
        </View>

        {/* UNIT SUMMARIES */}
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3">Workload by Unit</Text>

          {/* Unit I */}
          <View className="p-3 bg-blue-50 rounded mb-3">
            <Text className="text-sm font-semibold text-gray-700">Unit I - Lecture/Practical</Text>
            <View className="flex-row justify-between mt-2">
              <View>
                <Text className="text-xs text-gray-600">PG Classes</Text>
                <Text className="text-lg font-bold text-blue-600">{summary?.unit_i_pg_count || 0}</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-600">UG Classes</Text>
                <Text className="text-lg font-bold text-blue-600">{summary?.unit_i_ug_count || 0}</Text>
              </View>
            </View>
          </View>

          {/* Units II-VI */}
          {[
            { label: 'Tutorial (II)', hours: summary?.unit_ii_total_hours, avg: summary?.unit_ii_avg_daily },
            { label: 'Examination (III)', hours: summary?.unit_iii_total_hours, avg: summary?.unit_iii_avg_daily },
            { label: 'Research (IV)', hours: summary?.unit_iv_total_hours, avg: summary?.unit_iv_avg_daily },
            { label: 'Preparation (V)', hours: summary?.unit_v_total_hours, avg: summary?.unit_v_avg_daily },
            { label: 'Extension (VI)', hours: summary?.unit_vi_total_hours, avg: summary?.unit_vi_avg_daily },
          ].map(({ label, hours, avg }) => (
            <View key={label} className="p-3 bg-gray-50 rounded mb-2">
              <Text className="text-sm font-semibold text-gray-700">{label}</Text>
              <View className="flex-row justify-between mt-2">
                <View>
                  <Text className="text-xs text-gray-600">Total</Text>
                  <Text className="text-lg font-bold text-gray-900">{hours?.toFixed(1) || 0} hrs</Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-600">Avg/Day</Text>
                  <Text className="text-lg font-bold text-gray-900">{avg?.toFixed(1) || 0} hrs</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* SUBMISSION */}
        <View className="gap-2 mb-4">
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-green-500 rounded py-3"
          >
            <Text className="text-white text-center font-bold">Submit for HOD Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-200 rounded py-3">
            <Text className="text-gray-700 text-center font-bold">Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## Phase 3: HOD/Principal Approval Flow

### Approval Component

```typescript
// app/(hod)/diary-approvals/index.tsx

export default function DiaryApprovals() {
  const [pendingDiaries, setPendingDiaries] = useState<WorkDiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingDiaries();
  }, []);

  const loadPendingDiaries = async () => {
    const { data, error } = await supabase
      .from('work_diaries')
      .select('*, teachers(name), work_diary_summaries(*)')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });

    if (data) setPendingDiaries(data);
    setLoading(false);
  };

  return (
    <FlatList
      data={pendingDiaries}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('DiaryApprovalDetail', { diaryId: item.id })}
          className="p-4 border-b border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-bold">{item.teachers.name}</Text>
              <Text className="text-sm text-gray-600">
                {new Date(item.submitted_at).toLocaleDateString()}
              </Text>
            </View>
            <View className="bg-yellow-100 px-3 py-1 rounded">
              <Text className="text-yellow-800 font-semibold">Pending</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View className="p-4 text-center">
          <Text className="text-gray-600">No pending approvals</Text>
        </View>
      }
    />
  );
}

// app/(hod)/diary-approvals/[diaryId].tsx
export default function DiaryApprovalDetail() {
  const { diaryId } = useRoute().params;
  const [diary, setDiary] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    const { data, error } = await supabase
      .from('work_diaries')
      .select('*, teachers(*), work_diary_summaries(*), work_diary_daily_entries(*)')
      .eq('id', diaryId)
      .single();

    if (data) setDiary(data);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      // Call RPC function to approve
      const { error } = await supabase
        .rpc('approve_work_diary', {
          diary_id: diaryId,
          is_principal: false, // HOD approval
        });

      if (error) throw error;

      // Log approval
      await supabase.from('work_diary_audit_log').insert({
        work_diary_id: diaryId,
        changed_by: user.id,
        change_type: 'hod_approved',
        old_status: 'submitted',
        new_status: 'hod_approved',
      });

      Alert.alert('Success', 'Diary approved');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve diary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('work_diaries')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', diaryId);

      if (error) throw error;

      // Log rejection
      await supabase.from('work_diary_audit_log').insert({
        work_diary_id: diaryId,
        changed_by: user.id,
        change_type: 'hod_rejected',
        old_status: 'submitted',
        new_status: 'rejected',
        rejection_reason: rejectionReason,
      });

      Alert.alert('Rejected', 'Diary returned to teacher');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject diary');
    } finally {
      setSubmitting(false);
    }
  };

  if (!diary) return <ActivityIndicator />;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* SUMMARY DISPLAY */}
        <View className="mb-4 p-4 bg-gray-50 rounded">
          <Text className="text-lg font-bold mb-3">Monthly Summary</Text>
          {diary.work_diary_summaries && (
            <>
              <SummaryRow label="PG Classes" value={diary.work_diary_summaries.unit_i_pg_count} />
              <SummaryRow label="UG Classes" value={diary.work_diary_summaries.unit_i_ug_count} />
              <SummaryRow label="Tutorial Hours" value={diary.work_diary_summaries.unit_ii_total_hours} />
              {/* ... more summary rows */}
            </>
          )}
        </View>

        {/* APPROVAL DECISION */}
        <View className="mb-4">
          <Text className="text-lg font-bold mb-3">Decision</Text>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Rejection Reason (if applicable)</Text>
            <TextInput
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded p-3"
            />
          </View>
        </View>

        {/* BUTTONS */}
        <View className="gap-2">
          <TouchableOpacity
            onPress={handleApprove}
            disabled={submitting}
            className="bg-green-500 rounded py-3"
          >
            <Text className="text-white text-center font-bold">✓ Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReject}
            disabled={submitting}
            className="bg-red-500 rounded py-3"
          >
            <Text className="text-white text-center font-bold">✕ Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## Testing Checklist

### Unit Tests

```typescript
// __tests__/diaryCalculations.test.ts

import { calculateMonthlySummary } from '@/lib/diaryCalculations';

describe('Diary Calculations', () => {
  test('calculates PG and UG classes correctly', () => {
    const entries = [
      {
        date: '2026-01-01',
        day_status: 'W',
        periods: [
          { slot: 'p1', class_code: 'D_1' },
          { slot: 'p2', class_code: 'M_2' },
          { slot: 'p3', class_code: 'D_3' },
        ],
        tasks: { /* ... */ },
      },
    ];

    const summary = calculateMonthlySummary(entries);
    expect(summary.unit_i_pg_count).toBe(1);
    expect(summary.unit_i_ug_count).toBe(2);
  });

  test('sums task hours correctly', () => {
    const entries = [
      {
        date: '2026-01-01',
        day_status: 'W',
        periods: [],
        tasks: {
          unit_ii_hours: 2,
          unit_iii_hours: 1,
          unit_iv_hours: 0.5,
          unit_v_hours: 1.5,
          unit_vi_hours: 0,
        },
      },
    ];

    const summary = calculateMonthlySummary(entries);
    expect(summary.unit_ii_total_hours).toBe(2);
    expect(summary.unit_iii_total_hours).toBe(1);
  });

  test('enforces 5-hour max per unit per day', () => {
    // Validation should happen in component, not here
    // But can test the limits in UI tests
  });
});
```

### Integration Tests

- [ ] Teacher creates daily entry
- [ ] Entry is saved to `work_diaries.daily_entries`
- [ ] Holiday status locks row
- [ ] Leave status locks row
- [ ] Summary calculates correctly
- [ ] Teacher submits month
- [ ] HOD can view pending approvals
- [ ] HOD can approve (status → `hod_approved`)
- [ ] HOD can reject (status → `rejected`)
- [ ] Principal can view HOD-approved diaries
- [ ] Principal can approve (status → `principal_approved`)
- [ ] Teacher can see rejection reason and edit
- [ ] Audit log records all changes

---

## API Documentation

### New RLS Policies

```sql
-- Teachers can only edit diaries in 'draft' status
CREATE POLICY "Teachers edit own draft diaries" ON work_diaries
  FOR UPDATE
  TO authenticated
  USING (
    teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
    AND status = 'draft'
  );

-- HOD can approve diaries for their department teachers
CREATE POLICY "HOD approves department diaries" ON work_diaries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN departments d ON t.department_id = d.id
      WHERE t.id = work_diaries.teacher_id
      AND d.hod_user_id = auth.uid()
      AND work_diaries.status = 'submitted'
    )
  );

-- Principal can approve any diary
CREATE POLICY "Principal approves all diaries" ON work_diaries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'principal'
    )
  );
```

---

## Deployment Notes

1. **Run migrations:** `supabase migration deploy`
2. **Test RLS policies** in Supabase Studio before production
3. **Update app version** to trigger iOS/Android bundle rebuild
4. **Monitor audit logs** for approval issues

---

**Implementation Status:** Ready for Phase 1 Development  
**Last Updated:** 2026-01-08
