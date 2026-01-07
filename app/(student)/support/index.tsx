import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Animated, { FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';

type ContactProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

function formatPhone(phone: string | null | undefined) {
  if (!phone) return null;
  return phone.replace(/\s+/g, ' ').trim();
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classTeacher, setClassTeacher] = useState<ContactProfile | null>(null);
  const [hod, setHod] = useState<ContactProfile | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const student = await getStudentByUserId(user.id);
    if (!student) {
      setClassTeacher(null);
      setHod(null);
      return;
    }

    const [{ data: sectionRow, error: sectionErr }, { data: deptRow, error: deptErr }] = await Promise.all([
      student.section_id
        ? supabase.from('sections').select('id, class_teacher_id').eq('id', student.section_id).maybeSingle()
        : Promise.resolve({ data: null, error: null } as any),
      supabase.from('departments').select('id, hod_user_id').eq('id', student.department_id).maybeSingle(),
    ]);

    if (sectionErr) console.log('Support section error:', sectionErr.message);
    if (deptErr) console.log('Support department error:', deptErr.message);

    const classTeacherId = (sectionRow as any)?.class_teacher_id as string | null;
    const hodUserId = (deptRow as any)?.hod_user_id as string | null;

    const [ctProfile, hodProfile] = await Promise.all([
      classTeacherId
        ? supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .eq('id', classTeacherId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null } as any),
      hodUserId
        ? supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .eq('id', hodUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null } as any),
    ]);

    if (ctProfile?.error) console.log('Support class teacher profile error:', ctProfile.error.message);
    if (hodProfile?.error) console.log('Support HOD profile error:', hodProfile.error.message);

    setClassTeacher((ctProfile?.data as any) || null);
    setHod((hodProfile?.data as any) || null);
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    init();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const callPhone = async (phone: string) => {
    const url = `tel:${phone}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Cannot call', 'Calling is not supported on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to start call');
    }
  };

  const mailTo = async (email: string) => {
    const url = `mailto:${email}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Cannot open mail', 'No email app available.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open mail app');
    }
  };

  const faq = useMemo(
    () => [
      { q: 'Attendance looks wrong', a: 'Pull down to refresh. If it still looks incorrect, raise a complaint with the date and period.' },
      { q: 'Marks not showing', a: 'Internal marks appear after verification. External uploads show after approval.' },
      { q: 'Need to change profile details', a: 'Open Profile from Settings and contact your class teacher/admin if a field is locked.' },
    ],
    []
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Support</Text>
          <View style={{ width: 28 }} />
        </View>

        {!user?.id ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Not signed in</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Please log in to view support.</Text>
          </Card>
        ) : loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInRight.duration(300)}>
              <Card style={{ marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Help</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Raise a ticket for any issue</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton
                    title="Open Complaints"
                    onPress={() => router.push('/(student)/feedback')}
                    variant="outline"
                    size="medium"
                  />
                </View>
              </Card>

              <Card style={{ marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contacts</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>For urgent academic help</Text>

                <View style={{ marginTop: 10 }}>
                  <View style={styles.contactRow}>
                    <Ionicons name="person-circle-outline" size={22} color={colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Class Teacher</Text>
                      {classTeacher ? (
                        <>
                          <Text style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            {classTeacher.full_name}
                          </Text>
                          <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
                            {classTeacher.email}
                            {formatPhone(classTeacher.phone) ? ` • ${formatPhone(classTeacher.phone)}` : ''}
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                          Not assigned
                        </Text>
                      )}
                    </View>
                    {classTeacher?.phone ? (
                      <TouchableOpacity onPress={() => callPhone(classTeacher.phone!)}>
                        <Ionicons name="call-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => classTeacher?.email && mailTo(classTeacher.email)} style={{ marginLeft: 12 }}>
                      <Ionicons name="mail-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.contactRow}>
                    <Ionicons name="school-outline" size={22} color={colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>HOD</Text>
                      {hod ? (
                        <>
                          <Text style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            {hod.full_name}
                          </Text>
                          <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
                            {hod.email}
                            {formatPhone(hod.phone) ? ` • ${formatPhone(hod.phone)}` : ''}
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.rowMeta, { color: colors.textMuted }]}>Not available</Text>
                      )}
                    </View>
                    {hod?.phone ? (
                      <TouchableOpacity onPress={() => callPhone(hod.phone!)}>
                        <Ionicons name="call-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => hod?.email && mailTo(hod.email)} style={{ marginLeft: 12 }}>
                      <Ionicons name="mail-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>

              <Card>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>FAQ</Text>
                <View style={{ marginTop: 10 }}>
                  {faq.map((item) => (
                    <View key={item.q} style={styles.faqRow}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.q}</Text>
                      <Text style={[styles.rowBody, { color: colors.textSecondary }]}>{item.a}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  rowBody: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  faqRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});
