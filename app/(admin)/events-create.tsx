import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../components/ui';
import { Restricted } from '../../components/Restricted';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { PERMISSIONS } from '../../hooks/useRBAC';

function toIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function EventsCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const startIso = useMemo(() => toIsoOrNull(startDateTime), [startDateTime]);
  const endIso = useMemo(() => toIsoOrNull(endDateTime), [endDateTime]);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (!startIso) return false;
    if (endDateTime.trim() && !endIso) return false;
    if (startIso && endIso && new Date(endIso) < new Date(startIso)) return false;
    if (!isValidHttpUrl(registrationLink)) return false;
    return true;
  }, [title, startIso, endIso, endDateTime, registrationLink]);

  const handleCreate = async () => {
    if (!canSave) {
      Alert.alert('Invalid form', 'Please check Title, Date/Time, and Registration Link fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType.trim() || null,
        start_datetime: startIso!,
        end_datetime: endIso,
        venue: venue.trim() || null,
        registration_link: registrationLink.trim(),
        poster_url: posterUrl.trim() || null,
        is_active: isActive,
        created_by: user?.id ?? null,
      };

      const { error } = await supabase.from('events').insert(payload);
      if (error) throw error;

      Alert.alert('Success', 'Event created');
      router.back();
    } catch (err) {
      console.error('Error creating event:', err);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Restricted
      module="events"
      permissions={PERMISSIONS.MANAGE_EVENTS}
      showDeniedMessage
      deniedMessage="You do not have permission to create events."
    >
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Event</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Fill details and save
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
            showsVerticalScrollIndicator={false}
          >
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
              <GlassInput
                value={title}
                onChangeText={setTitle}
                placeholder="Event title"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Event Type</Text>
              <GlassInput
                value={eventType}
                onChangeText={setEventType}
                placeholder="cultural / technical / sports / seminar"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Start Date/Time *</Text>
              <GlassInput
                value={startDateTime}
                onChangeText={setStartDateTime}
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>End Date/Time</Text>
              <GlassInput
                value={endDateTime}
                onChangeText={setEndDateTime}
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Venue</Text>
              <GlassInput value={venue} onChangeText={setVenue} placeholder="Venue" />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Registration Link</Text>
              <GlassInput
                value={registrationLink}
                onChangeText={setRegistrationLink}
                placeholder="https://..."
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Poster URL</Text>
              <GlassInput
                value={posterUrl}
                onChangeText={setPosterUrl}
                placeholder="https://..."
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                placeholderTextColor={colors.placeholder}
                multiline
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                    borderRadius: colors.borderRadius,
                  },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.toggle,
                  {
                    borderColor: colors.cardBorder,
                    borderWidth: colors.borderWidth,
                    borderRadius: colors.borderRadius,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setIsActive((v) => !v)}
              >
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Publish</Text>
                <Text style={[styles.toggleValue, { color: isActive ? colors.success : colors.warning }]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>

              <PrimaryButton
                title="Save Event"
                onPress={handleCreate}
                loading={saving}
                disabled={!canSave || saving}
                style={{ marginTop: 16 }}
              />
            </GlassCard>
          </ScrollView>
        </View>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { marginTop: 2, fontSize: 13 },
  scroll: { flex: 1 },
  card: { marginHorizontal: 20, padding: 16 },
  label: { fontSize: 13, marginBottom: 8 },
  textArea: { padding: 12, minHeight: 110, textAlignVertical: 'top' },
  toggle: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleValue: { fontSize: 14, fontWeight: '700' },
});
