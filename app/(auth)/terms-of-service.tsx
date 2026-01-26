/**
 * Terms of Service Screen
 * 
 * Displays the app's terms of service for legal compliance.
 * Accessible from registration and settings.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';

export default function TermsOfServiceScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Terms of Service</Text>
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
          <Text style={headingStyle}>Agreement to Terms</Text>
          <Text style={textStyle}>
            By accessing or using the JPM College App ("the App"), you agree to be bound by 
            these Terms of Service ("Terms"). If you disagree with any part of these terms, 
            you may not access the App.
          </Text>
          <Text style={textStyle}>
            These Terms apply to all users of the App, including students, teachers, 
            administrative staff, and parents/guardians.
          </Text>
        </View>

        {/* Eligibility */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>1. Eligibility</Text>
          <Text style={textStyle}>To use this App, you must:</Text>
          <Text style={bulletStyle}>• Be a registered student, teacher, or staff member of JPM College</Text>
          <Text style={bulletStyle}>• Have valid login credentials issued by the institution</Text>
          <Text style={bulletStyle}>• If under 18, have parental/guardian consent</Text>
          <Text style={bulletStyle}>• Not be previously banned from using the App</Text>
        </View>

        {/* Account Responsibilities */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>2. Account Responsibilities</Text>
          
          <Text style={subheadingStyle}>2.1 Account Security</Text>
          <Text style={textStyle}>You are responsible for:</Text>
          <Text style={bulletStyle}>• Maintaining the confidentiality of your login credentials</Text>
          <Text style={bulletStyle}>• All activities that occur under your account</Text>
          <Text style={bulletStyle}>• Notifying us immediately of any unauthorized access</Text>
          
          <Text style={subheadingStyle}>2.2 Accurate Information</Text>
          <Text style={textStyle}>
            You agree to provide accurate, current, and complete information during 
            registration and to update such information as necessary.
          </Text>
        </View>

        {/* Acceptable Use */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>3. Acceptable Use</Text>
          <Text style={textStyle}>You agree NOT to:</Text>
          <Text style={bulletStyle}>• Share your login credentials with others</Text>
          <Text style={bulletStyle}>• Access another user's account without permission</Text>
          <Text style={bulletStyle}>• Attempt to bypass security measures</Text>
          <Text style={bulletStyle}>• Upload malicious content or code</Text>
          <Text style={bulletStyle}>• Use the App for any illegal purpose</Text>
          <Text style={bulletStyle}>• Harass, abuse, or harm other users</Text>
          <Text style={bulletStyle}>• Interfere with the proper functioning of the App</Text>
          <Text style={bulletStyle}>• Collect user information without consent</Text>
        </View>

        {/* Academic Integrity */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>4. Academic Integrity</Text>
          <Text style={textStyle}>
            When using the App for academic purposes (assignments, exams, etc.), you must 
            adhere to the institution's academic integrity policies. This includes:
          </Text>
          <Text style={bulletStyle}>• Submitting only your own original work</Text>
          <Text style={bulletStyle}>• Not sharing exam answers or assignment solutions</Text>
          <Text style={bulletStyle}>• Not manipulating attendance records</Text>
          <Text style={bulletStyle}>• Reporting any technical issues honestly</Text>
          <Text style={textStyle}>
            Violations may result in disciplinary action as per institutional policies.
          </Text>
        </View>

        {/* Intellectual Property */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>5. Intellectual Property</Text>
          <Text style={textStyle}>
            The App and its original content, features, and functionality are owned by 
            JPM College and are protected by copyright, trademark, and other intellectual 
            property laws.
          </Text>
          <Text style={textStyle}>
            Course materials, lecture notes, and other educational content shared through 
            the App remain the property of the respective authors/instructors.
          </Text>
        </View>

        {/* Content You Provide */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>6. Content You Provide</Text>
          <Text style={textStyle}>
            By uploading or submitting content (assignments, profile photos, etc.) to the 
            App, you grant us a non-exclusive license to use, store, and display that 
            content for the purposes of providing our services.
          </Text>
          <Text style={textStyle}>
            You represent that you have the right to share any content you upload and that 
            it does not violate any laws or third-party rights.
          </Text>
        </View>

        {/* Availability */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>7. Service Availability</Text>
          <Text style={textStyle}>
            We strive to maintain the App's availability but do not guarantee uninterrupted 
            access. The App may be temporarily unavailable due to:
          </Text>
          <Text style={bulletStyle}>• Scheduled maintenance</Text>
          <Text style={bulletStyle}>• Technical issues</Text>
          <Text style={bulletStyle}>• Force majeure events</Text>
          <Text style={textStyle}>
            We are not liable for any loss or inconvenience caused by temporary unavailability.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>8. Limitation of Liability</Text>
          <Text style={textStyle}>
            To the maximum extent permitted by law, JPM College shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising from 
            your use of the App.
          </Text>
          <Text style={textStyle}>
            Our liability is limited to the extent required by applicable law.
          </Text>
        </View>

        {/* Termination */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>9. Termination</Text>
          <Text style={textStyle}>
            We may terminate or suspend your account and access to the App immediately, 
            without prior notice, for:
          </Text>
          <Text style={bulletStyle}>• Violation of these Terms</Text>
          <Text style={bulletStyle}>• Conduct harmful to other users or the institution</Text>
          <Text style={bulletStyle}>• Upon your graduation or separation from the institution</Text>
          <Text style={textStyle}>
            Upon termination, your right to use the App will cease immediately.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>10. Governing Law</Text>
          <Text style={textStyle}>
            These Terms shall be governed by and construed in accordance with the laws of 
            India. Any disputes arising from these Terms shall be subject to the exclusive 
            jurisdiction of the courts in [City], India.
          </Text>
        </View>

        {/* Changes */}
        <View style={sectionStyle}>
          <Text style={headingStyle}>11. Changes to Terms</Text>
          <Text style={textStyle}>
            We reserve the right to modify these Terms at any time. We will notify users of 
            any material changes through the App or via email. Continued use of the App 
            after changes constitutes acceptance of the modified Terms.
          </Text>
        </View>

        {/* Contact */}
        <View style={[sectionStyle, { borderBottomWidth: 0 }]}>
          <Text style={headingStyle}>12. Contact Us</Text>
          <Text style={textStyle}>
            If you have questions about these Terms, please contact:
          </Text>
          <Text style={[textStyle, { marginTop: 8 }]}>
            JPM College Administration{'\n'}
            Email: support@jpmcollege.edu.in{'\n'}
            Phone: +91-XXXX-XXXXXX
          </Text>
        </View>

        {/* Acceptance Notice */}
        <View
          style={[
            styles.legalNotice,
            { backgroundColor: withAlpha(colors.warning, isDark ? 0.1 : 0.05) },
          ]}
        >
          <Ionicons name="document-text" size={20} color={colors.warning} />
          <Text style={[styles.legalNoticeText, { color: colors.textSecondary }]}>
            By creating an account or using the App, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms of Service.
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
