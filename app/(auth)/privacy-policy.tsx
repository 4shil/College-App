/**
 * Privacy Policy Screen
 * 
 * Displays the app's privacy policy for legal compliance.
 * Accessible from registration and settings.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const sectionStyle = [styles.section, { borderBottomColor: colors.glassBorder }];
  const headingStyle = [styles.heading, { color: colors.textPrimary }];
  const subheadingStyle = [styles.subheading, { color: colors.textPrimary }];
  const textStyle = [styles.text, { color: colors.textSecondary }];
  const bulletStyle = [styles.bullet, { color: colors.textSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: isDark ? withAlpha(colors.glassBackground, 0.9) : colors.glassBackground,
            borderBottomColor: colors.glassBorder,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
          Last updated: January 25, 2026
        </Text>

        {/* Introduction */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>Introduction</Text>
          <Text style={textStyle}>
            Welcome to JPM College App ("we," "our," or "us"). We are committed to protecting 
            your personal information and your right to privacy. This Privacy Policy explains 
            how we collect, use, disclose, and safeguard your information when you use our 
            mobile application.
          </Text>
          <Text style={textStyle}>
            Please read this privacy policy carefully. By using the app, you agree to the 
            collection and use of information in accordance with this policy.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>1. Information We Collect</Text>
          
          <Text style={subheadingStyle}>1.1 Personal Information</Text>
          <Text style={textStyle}>When you register and use our app, we collect:</Text>
          <Text style={bulletStyle}>• Full name</Text>
          <Text style={bulletStyle}>• Email address</Text>
          <Text style={bulletStyle}>• Phone number</Text>
          <Text style={bulletStyle}>• Date of birth</Text>
          <Text style={bulletStyle}>• Gender</Text>
          <Text style={bulletStyle}>• APAAR ID (Automated Permanent Academic Account Registry)</Text>
          <Text style={bulletStyle}>• Roll number and admission number</Text>
          <Text style={bulletStyle}>• Profile photograph</Text>

          <Text style={subheadingStyle}>1.2 Academic Information</Text>
          <Text style={textStyle}>We collect academic data including:</Text>
          <Text style={bulletStyle}>• Course enrollment details</Text>
          <Text style={bulletStyle}>• Attendance records</Text>
          <Text style={bulletStyle}>• Examination marks and grades</Text>
          <Text style={bulletStyle}>• Assignment submissions</Text>
          <Text style={bulletStyle}>• Fee payment status</Text>

          <Text style={subheadingStyle}>1.3 Device Information</Text>
          <Text style={textStyle}>We may collect device information such as:</Text>
          <Text style={bulletStyle}>• Device type and operating system</Text>
          <Text style={bulletStyle}>• App version</Text>
          <Text style={bulletStyle}>• Anonymous usage analytics (if enabled)</Text>
        </View>

        {/* How We Use Information */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>2. How We Use Your Information</Text>
          <Text style={textStyle}>We use your personal information to:</Text>
          <Text style={bulletStyle}>• Provide and maintain our educational services</Text>
          <Text style={bulletStyle}>• Manage your student/teacher account</Text>
          <Text style={bulletStyle}>• Track and display academic progress</Text>
          <Text style={bulletStyle}>• Send important notifications about classes, exams, and events</Text>
          <Text style={bulletStyle}>• Communicate with parents/guardians when necessary</Text>
          <Text style={bulletStyle}>• Improve our app and services</Text>
          <Text style={bulletStyle}>• Comply with legal obligations</Text>
        </View>

        {/* Data Sharing */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>3. Data Sharing and Disclosure</Text>
          <Text style={textStyle}>We may share your information with:</Text>
          <Text style={bulletStyle}>• College administration, teachers, and authorized staff</Text>
          <Text style={bulletStyle}>• Government education authorities (for APAAR integration)</Text>
          <Text style={bulletStyle}>• Parents/guardians (for minor students)</Text>
          <Text style={bulletStyle}>• Service providers who assist in app operations</Text>
          
          <Text style={[textStyle, { fontWeight: '600', marginTop: 12 }]}>
            We do NOT sell, rent, or trade your personal information to third parties for 
            marketing purposes.
          </Text>
        </View>

        {/* Data Security */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>4. Data Security</Text>
          <Text style={textStyle}>
            We implement appropriate security measures to protect your data:
          </Text>
          <Text style={bulletStyle}>• Encryption of data in transit (TLS/HTTPS)</Text>
          <Text style={bulletStyle}>• Encryption of sensitive data at rest</Text>
          <Text style={bulletStyle}>• Secure token storage on your device</Text>
          <Text style={bulletStyle}>• Role-based access control</Text>
          <Text style={bulletStyle}>• Regular security audits</Text>
          <Text style={textStyle}>
            However, no method of transmission over the Internet is 100% secure. While we 
            strive to protect your data, we cannot guarantee absolute security.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>5. Data Retention</Text>
          <Text style={textStyle}>
            We retain your personal data for as long as you are enrolled at the institution, 
            plus an additional period of 7 years for record-keeping purposes as required by 
            educational regulations.
          </Text>
          <Text style={textStyle}>
            After this period, your data will be anonymized or deleted, except where required 
            by law to retain it longer.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>6. Your Rights</Text>
          <Text style={textStyle}>
            Under applicable data protection laws, you have the right to:
          </Text>
          <Text style={bulletStyle}>• Access your personal data</Text>
          <Text style={bulletStyle}>• Correct inaccurate information</Text>
          <Text style={bulletStyle}>• Request deletion of your data (subject to legal requirements)</Text>
          <Text style={bulletStyle}>• Withdraw consent for optional data processing</Text>
          <Text style={bulletStyle}>• File a complaint with data protection authorities</Text>
          <Text style={textStyle}>
            To exercise these rights, contact us at the address provided below.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>7. Children's Privacy</Text>
          <Text style={textStyle}>
            Our app may be used by students under 18 years of age. For minor students, 
            we require parental/guardian consent for data collection and processing. 
            Parents/guardians have the right to access, correct, or delete their child's 
            information.
          </Text>
        </View>

        {/* Updates */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>8. Changes to This Policy</Text>
          <Text style={textStyle}>
            We may update this privacy policy from time to time. We will notify you of any 
            changes by posting the new policy in the app and updating the "Last updated" date. 
            You are advised to review this policy periodically.
          </Text>
        </View>

        {/* Contact */}
        <View style={[sectionStyle, { borderBottomWidth: 0 }]}>
          <Text style={headingStyle}>9. Contact Us</Text>
          <Text style={textStyle}>
            If you have questions or concerns about this privacy policy or our data practices, 
            please contact:
          </Text>
          <Text style={[textStyle, { marginTop: 8 }]}>
            Data Protection Officer{'\n'}
            JPM College{'\n'}
            Email: privacy@jpmcollege.edu.in{'\n'}
            Phone: +91-XXXX-XXXXXX
          </Text>
        </View>

        {/* DPDPA Notice */}
        <View
          style={[
            styles.legalNotice,
            { backgroundColor: withAlpha(colors.info, isDark ? 0.1 : 0.05) },
          ]}
        >
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.legalNoticeText, { color: colors.textSecondary }]}>
            This policy is compliant with India's Digital Personal Data Protection Act (DPDPA) 
            2023 and applicable data protection regulations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 24,
    paddingLeft: 8,
  },
  legalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  legalNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
