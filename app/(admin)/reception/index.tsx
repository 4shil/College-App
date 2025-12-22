import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, PrimaryButton } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';

export default function ReceptionDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  return (
    <Restricted module="reception" showDeniedMessage deniedMessage="You do not have access to Reception module.">
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
          ]}
        >
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Reception</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Execution-only front desk tools</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <Card>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconPill, { backgroundColor: colors.inputBackground, borderRadius: colors.borderRadius }]}>
                  <FontAwesome5 name="info-circle" size={16} color={colors.textSecondary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Rules</Text>
              </View>
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>- Use Admission Number only</Text>
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>- Append-only, no edits/deletes</Text>
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>- Gate Pass: verify approved only, mark EXIT</Text>
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>- Late Pass: only until end of 3rd hour, one per day</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Actions</Text>
              <View style={styles.actionsGap}>
                <PrimaryButton
                  title="Gate Pass Verification"
                  onPress={() => router.push('/(admin)/reception/gate-pass' as any)}
                  icon={<FontAwesome5 name="door-open" size={16} color={colors.textInverse} />}
                />
                <PrimaryButton
                  title="Issue Late Pass"
                  onPress={() => router.push('/(admin)/reception/issue-late-pass' as any)}
                  icon={<FontAwesome5 name="clock" size={16} color={colors.textInverse} />}
                />
                <PrimaryButton
                  title="Today's Logs"
                  onPress={() => router.push('/(admin)/reception/todays-logs' as any)}
                  variant="outline"
                  glowing={false}
                  icon={<FontAwesome5 name="clipboard-list" size={16} color={colors.primary} />}
                />
                <PrimaryButton
                  title="Notices (View Only)"
                  onPress={() => router.push('/(admin)/reception/notices' as any)}
                  variant="outline"
                  glowing={false}
                  icon={<FontAwesome5 name="bullhorn" size={16} color={colors.primary} />}
                />
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { marginTop: 6, fontSize: 14 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconPill: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  ruleText: { fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionsGap: { gap: 12 },
});
