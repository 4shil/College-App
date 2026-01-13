import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { Card } from '../ui';

interface HallTicketData {
  studentName: string;
  registrationNumber: string;
  rollNumber?: string;
  courseName: string;
  semester: number;
  examName: string;
  examCenter?: string;
  photoUrl?: string;
  // Exam schedule
  examSchedule: Array<{
    date: string;
    day: string;
    time: string;
    subjectCode: string;
    subjectName: string;
  }>;
  // Instructions
  instructions?: string[];
}

interface HallTicketProps {
  data: HallTicketData;
  collegeName?: string;
  collegeLogo?: string;
}

/**
 * Hall Ticket Preview Component
 * Displays exam hall ticket for students
 */
export function HallTicket({ data, collegeName = 'College Name', collegeLogo }: HallTicketProps) {
  const { colors } = useThemeStore();

  const defaultInstructions = [
    '✓ Bring this hall ticket to the examination center',
    '✓ Carry a valid photo ID card',
    '✓ Report to the exam center 30 minutes before exam time',
    '✓ Mobile phones and electronic devices are strictly prohibited',
    '✓ Maintain discipline and follow exam center rules',
  ];

  const instructions = data.instructions || defaultInstructions;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {collegeLogo && (
            <Image source={{ uri: collegeLogo }} style={styles.collegeLogo} resizeMode="contain" />
          )}
          <Text style={[styles.collegeName, { color: colors.textPrimary }]}>{collegeName}</Text>
          <Text style={[styles.hallTicketTitle, { color: colors.primary }]}>EXAMINATION HALL TICKET</Text>
        </View>

        {/* Student Info */}
        <View style={styles.section}>
          <View style={styles.studentInfoRow}>
            <View style={styles.studentDetails}>
              <InfoRow label="Name" value={data.studentName} colors={colors} />
              <InfoRow label="Registration No" value={data.registrationNumber} colors={colors} />
              {data.rollNumber && <InfoRow label="Roll No" value={data.rollNumber} colors={colors} />}
              <InfoRow label="Course" value={data.courseName} colors={colors} />
              <InfoRow label="Semester" value={`Semester ${data.semester}`} colors={colors} />
              <InfoRow label="Examination" value={data.examName} colors={colors} />
              {data.examCenter && <InfoRow label="Exam Center" value={data.examCenter} colors={colors} />}
            </View>
            
            {data.photoUrl && (
              <View style={[styles.photoContainer, { borderColor: colors.border }]}>
                <Image source={{ uri: data.photoUrl }} style={styles.photo} resizeMode="cover" />
              </View>
            )}
          </View>
        </View>

        {/* Exam Schedule */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Examination Schedule</Text>
          <View style={[styles.table, { borderColor: colors.border }]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tableHeaderText, { color: colors.textPrimary, flex: 1.2 }]}>Date & Day</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textPrimary, flex: 1 }]}>Time</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textPrimary, flex: 1.5 }]}>Subject Code</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textPrimary, flex: 2 }]}>Subject Name</Text>
            </View>
            
            {/* Table Rows */}
            {data.examSchedule.map((exam, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  { borderTopColor: colors.border },
                  index > 0 && styles.tableRowBorder,
                ]}
              >
                <View style={{ flex: 1.2 }}>
                  <Text style={[styles.tableCellText, { color: colors.textPrimary }]}>{exam.date}</Text>
                  <Text style={[styles.tableCellSubText, { color: colors.textMuted }]}>{exam.day}</Text>
                </View>
                <Text style={[styles.tableCellText, { color: colors.textSecondary, flex: 1 }]}>{exam.time}</Text>
                <Text style={[styles.tableCellText, { color: colors.textSecondary, flex: 1.5 }]}>{exam.subjectCode}</Text>
                <Text style={[styles.tableCellText, { color: colors.textPrimary, flex: 2 }]} numberOfLines={2}>
                  {exam.subjectName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Instructions</Text>
          {instructions.map((instruction, index) => (
            <Text key={index} style={[styles.instruction, { color: colors.textSecondary }]}>
              {instruction}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Student Signature</Text>
            <View style={[styles.signatureLine, { borderBottomColor: colors.border }]} />
          </View>
          <View>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Controller of Examinations</Text>
            <View style={[styles.signatureLine, { borderBottomColor: colors.border }]} />
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}:</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  collegeLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  collegeName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  hallTicketTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  studentInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  studentDetails: {
    flex: 1,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 120,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  photoContainer: {
    width: 100,
    height: 120,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  tableHeader: {
    paddingVertical: 12,
  },
  tableRowBorder: {
    borderTopWidth: 1,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tableCellText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableCellSubText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  instruction: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    marginTop: 10,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 24,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
  },
});
