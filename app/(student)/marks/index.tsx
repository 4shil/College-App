import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

type MarkRow = {
	id: string;
	marks_obtained: number | null;
	is_absent: boolean;
	remarks: string | null;
	verified_at: string | null;
	exam_schedules: {
		id: string;
		date: string;
		max_marks: number | null;
		courses?: { code: string; name: string; short_name: string | null } | null;
		exams?: { id: string; name: string; exam_type: string } | null;
	};
};

function formatShortDate(dateISO: string) {
	const d = new Date(dateISO);
	if (Number.isNaN(d.getTime())) return dateISO;
	return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function StudentMarksScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { colors, isDark } = useThemeStore();
	const { user } = useAuthStore();

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [studentId, setStudentId] = useState<string | null>(null);
	const [marks, setMarks] = useState<MarkRow[]>([]);

	const fetchAll = useCallback(async () => {
		if (!user?.id) return;
		try {
			setError(null);
			const student = await getStudentByUserId(user.id);
			const sId = student?.id || null;
			setStudentId(sId);
			if (!sId) {
				setMarks([]);
				return;
			}

			const { data, error: mErr } = await supabase
				.from('exam_marks')
				.select(
					`
						id,
						marks_obtained,
						is_absent,
						remarks,
						verified_at,
						exam_schedules!inner(
							id,
							date,
							max_marks,
							courses(code, name, short_name),
							exams(id, name, exam_type)
						)
					`
				)
				.eq('student_id', sId)
				.order('verified_at', { ascending: false })
				.limit(50);

			if (mErr) throw mErr;
			setMarks((data || []) as any);
		} catch (e: any) {
			console.log('Marks load error:', e?.message || e);
			setError(e?.message || 'Failed to load marks');
			setMarks([]);
		}
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

	const stats = useMemo(() => {
		let obtained = 0;
		let total = 0;
		for (const m of marks) {
			const max = m.exam_schedules?.max_marks ?? null;
			if (m.is_absent) continue;
			if (max == null) continue;
			total += max;
			if (m.marks_obtained != null) obtained += m.marks_obtained;
		}
		const pct = total > 0 ? (obtained / total) * 100 : 0;
		return { obtained, total, pct };
	}, [marks]);

	if (loading) {
		return (
			<AnimatedBackground>
				<View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
					<LoadingIndicator />
				</View>
			</AnimatedBackground>
		);
	}

	return (
		<AnimatedBackground>
			<View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
				<View style={styles.headerRow}>
					<TouchableOpacity onPress={() => router.back()}>
						<Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
					</TouchableOpacity>
					<View style={{ flex: 1, alignItems: 'center' }}>
						<Text style={[styles.header, { color: colors.textPrimary }]}>My Marks</Text>
						<Text style={[styles.headerSub, { color: colors.textMuted }]}>
							Latest internal marks ({marks.length})
						</Text>
					</View>
					<View style={{ width: 28 }} />
				</View>

				{error && (
					<Card style={{ marginBottom: 12, backgroundColor: withAlpha(colors.error, 0.12) }}>
						<Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
					</Card>
				)}

				{!studentId ? (
					<Card>
						<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
						<Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
					</Card>
				) : (
					<ScrollView
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
						showsVerticalScrollIndicator={false}
					>
						<Animated.View entering={FadeInRight.duration(350)}>
							<View style={styles.statsRow}>
								<Card style={{ flex: 1 }}>
									<Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
									<Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.total}</Text>
								</Card>
								<Card style={{ flex: 1 }}>
									<Text style={[styles.statLabel, { color: colors.textMuted }]}>Obtained</Text>
									<Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.obtained}</Text>
								</Card>
								<Card style={{ flex: 1 }}>
									<Text style={[styles.statLabel, { color: colors.textMuted }]}>%</Text>
									<Text style={[styles.statValue, { color: colors.primary }]}>{stats.pct.toFixed(1)}%</Text>
								</Card>
							</View>
						</Animated.View>

						<View style={{ marginTop: 12, marginBottom: 10 }}>
							<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Marks</Text>
							<Text style={[styles.sectionSub, { color: colors.textMuted }]}>Tap “Results” for external PDFs and SGPA/CGPA</Text>
						</View>

						<Card>
							<TouchableOpacity
								onPress={() => router.push('/(student)/results' as any)}
								activeOpacity={0.85}
								style={[
									styles.resultsBtn,
									{ backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14), borderColor: withAlpha(colors.primary, 0.35) },
								]}
							>
								<Ionicons name="document-text-outline" size={18} color={colors.primary} />
								<Text style={[styles.resultsBtnText, { color: colors.primary }]}>Open Results</Text>
							</TouchableOpacity>
						</Card>

						<View style={{ height: 12 }} />

						{marks.length === 0 ? (
							<Card>
								<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No marks yet</Text>
								<Text style={[styles.emptySub, { color: colors.textMuted }]}>Marks will appear after exams are evaluated.</Text>
							</Card>
						) : (
							marks.map((m, index) => {
								const courseLabel =
									m.exam_schedules?.courses?.short_name ||
									m.exam_schedules?.courses?.code ||
									m.exam_schedules?.courses?.name ||
									'Course';

								const examLabel = m.exam_schedules?.exams?.name || 'Exam';
								const max = m.exam_schedules?.max_marks ?? null;
								const score = m.is_absent ? 'AB' : (m.marks_obtained ?? '-');

								const chipBg = m.is_absent
									? withAlpha(colors.error, isDark ? 0.22 : 0.12)
									: withAlpha(colors.success, isDark ? 0.22 : 0.12);
								const chipText = m.is_absent ? colors.error : colors.success;

								return (
									<Animated.View key={m.id} entering={FadeInDown.delay(index * 20).duration(240)} style={{ marginBottom: 12 }}>
										<Card>
											<View style={styles.rowTop}>
												<View style={{ flex: 1 }}>
													<Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
														{courseLabel}
													</Text>
													<Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
														{examLabel} • {formatShortDate(m.exam_schedules.date)}
													</Text>
													{m.remarks ? (
														<Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>
															{m.remarks}
														</Text>
													) : null}
												</View>

												<View style={{ alignItems: 'flex-end', gap: 8 }}>
													<View style={[styles.scoreChip, { backgroundColor: chipBg }]}>
														<Text style={[styles.scoreText, { color: chipText }]}>
															{max ? `${score}/${max}` : String(score)}
														</Text>
													</View>
													<Text style={[styles.verified, { color: colors.textMuted }]}>
														{m.verified_at ? `Verified ${formatShortDate(m.verified_at)}` : 'Not verified'}
													</Text>
												</View>
											</View>
										</Card>
									</Animated.View>
								);
							})
						)}

						<View style={{ height: 20 }} />
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
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	header: {
		fontSize: 20,
		fontWeight: '900',
	},
	headerSub: {
		marginTop: 4,
		fontSize: 12,
	},
	statsRow: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 12,
	},
	statLabel: {
		fontSize: 12,
		fontWeight: '700',
	},
	statValue: {
		marginTop: 6,
		fontSize: 16,
		fontWeight: '900',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '800',
	},
	sectionSub: {
		marginTop: 4,
		fontSize: 12,
	},
	resultsBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 10,
	},
	resultsBtnText: {
		fontSize: 13,
		fontWeight: '900',
	},
	emptyTitle: {
		fontSize: 15,
		fontWeight: '800',
	},
	emptySub: {
		marginTop: 6,
		fontSize: 12,
	},
	rowTop: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
	},
	rowTitle: {
		fontSize: 15,
		fontWeight: '900',
	},
	rowSub: {
		marginTop: 4,
		fontSize: 12,
		fontWeight: '700',
	},
	rowMeta: {
		marginTop: 6,
		fontSize: 12,
	},
	scoreChip: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderRadius: 12,
	},
	scoreText: {
		fontSize: 12,
		fontWeight: '900',
	},
	verified: {
		fontSize: 11,
		fontWeight: '700',
	},
});
