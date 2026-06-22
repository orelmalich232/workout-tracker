import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSessions, getTemplates } from '../storage/storage';
import { WorkoutSession, WorkoutTemplate } from '../types';
import { COLORS, CARD_SHADOW } from '../theme';

// Day of week (0=Sun) → plan template id
const PLAN_DAY_MAP: Record<number, string> = {
  0: 'plan-a',  // Sunday
  2: 'plan-b',  // Tuesday
  4: 'plan-c',  // Thursday
  6: 'plan-d',  // Saturday
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REST_QUOTES = [
  'Recovery is where gains are made.',
  'Your muscles grow on rest days.',
  'Rest today. Crush it tomorrow. 💪',
  'Active recovery is still progress.',
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function calcStreak(sessions: WorkoutSession[]): number {
  const days = new Set(sessions.map(s => s.date.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 1; i <= 180; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else break;
  }
  return streak;
}

function workoutsThisWeek(sessions: WorkoutSession[]): WorkoutSession[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return sessions.filter(s => new Date(s.date) >= start);
}

function lastWorkoutLabel(sessions: WorkoutSession[]): string {
  if (!sessions.length) return '—';
  const diff = Math.floor((Date.now() - new Date(sessions[0].date).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

export default function HomeScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);

  useFocusEffect(
    useCallback(() => {
      const dow = new Date().getDay();
      const planId = PLAN_DAY_MAP[dow];
      Promise.all([getSessions(), getTemplates()]).then(([sess, tmpl]) => {
        setSessions(sess);
        setTodayTemplate(planId ? (tmpl.find(t => t.id === planId) ?? null) : null);
      });
    }, [])
  );

  const now = new Date();
  const dow = now.getDay();
  const isWorkoutDay = dow in PLAN_DAY_MAP;
  const streak = calcStreak(sessions);
  const thisWeekSessions = workoutsThisWeek(sessions);
  const lastLabel = lastWorkoutLabel(sessions);

  // Which days this week had a workout
  const weekDone = new Set(thisWeekSessions.map(s => new Date(s.date).getDay()));

  // Volume lifted today (if there's a session today)
  const todayKey = now.toISOString().slice(0, 10);
  const todaySession = sessions.find(s => s.date.slice(0, 10) === todayKey);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.header}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Stats inline in header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{streak}</Text>
            <Text style={styles.headerStatLabel}>🔥 Streak</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{thisWeekSessions.length}</Text>
            <Text style={styles.headerStatLabel}>📅 This week</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{sessions.length}</Text>
            <Text style={styles.headerStatLabel}>🏋️ Total</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Today card */}
        {isWorkoutDay && todayTemplate ? (
          <View style={[styles.card, styles.workoutCard]}>
            <View style={styles.workoutCardHeader}>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
              <Text style={styles.exCount}>{todayTemplate.exercises.length} exercises</Text>
            </View>
            <Text style={styles.workoutName}>{todayTemplate.name}</Text>
            <Text style={styles.exercisePreview} numberOfLines={1}>
              {todayTemplate.exercises.slice(0, 3).map(e => e.name).join('  ·  ')}
              {todayTemplate.exercises.length > 3 ? '  · ...' : ''}
            </Text>

            {todaySession ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.doneText}>Completed today · {todaySession.duration}m</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('ActiveWorkout', { template: todayTemplate })}
              >
                <Ionicons name="play" size={16} color="#FFF" />
                <Text style={styles.startBtnText}>Start Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.restCard]}>
            <Text style={styles.restEmoji}>😴</Text>
            <Text style={styles.restTitle}>Rest Day</Text>
            <Text style={styles.restSub}>{REST_QUOTES[dow % REST_QUOTES.length]}</Text>
          </View>
        )}

        {/* Week strip */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {DAY_LABELS.map((label, i) => {
              const isToday = i === dow;
              const done = weekDone.has(i);
              const isPlanned = i in PLAN_DAY_MAP;
              return (
                <View key={label} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
                  <View style={[
                    styles.dayDot,
                    done && styles.dayDotDone,
                    isToday && !done && isPlanned && styles.dayDotToday,
                    !isPlanned && !done && styles.dayDotRest,
                  ]}>
                    {done
                      ? <Ionicons name="checkmark" size={11} color="#FFF" />
                      : isPlanned
                        ? <View style={styles.dayDotInner} />
                        : null
                    }
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendLabel}>Done</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary }]} />
              <Text style={styles.legendLabel}>Planned</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.inputBg }]} />
              <Text style={styles.legendLabel}>Rest</Text>
            </View>
          </View>
        </View>

        {/* Last workout */}
        {sessions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Last Workout</Text>
            <View style={styles.lastRow}>
              <View style={styles.lastIcon}>
                <Ionicons name="barbell" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lastName}>{sessions[0].templateName}</Text>
                <Text style={styles.lastMeta}>
                  {lastLabel}  ·  {sessions[0].duration}m  ·  {sessions[0].exercises.length} exercises
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header gradient section
  header: {
    paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20,
  },
  greeting: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  dateText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  headerStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 4 },

  body: { padding: 16, marginTop: -16 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 18, marginBottom: 14,
    ...CARD_SHADOW,
  },

  // Workout day card
  workoutCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  todayBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  todayBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  exCount: { fontSize: 12, color: COLORS.muted },
  workoutName: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  exercisePreview: { fontSize: 12, color: COLORS.muted, marginBottom: 16 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13,
  },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  doneText: { color: COLORS.success, fontSize: 14, fontWeight: '500' },

  // Rest day card
  restCard: { alignItems: 'center', paddingVertical: 28 },
  restEmoji: { fontSize: 40, marginBottom: 10 },
  restTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  restSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },

  // Week strip
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
  dayLabelToday: { color: COLORS.primary, fontWeight: '700' },
  dayDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: COLORS.success },
  dayDotToday: { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary },
  dayDotRest: { backgroundColor: COLORS.inputBg },
  dayDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  legend: { flexDirection: 'row', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 11, color: COLORS.muted },

  // Last workout
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lastIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  lastName: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  lastMeta: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
});
