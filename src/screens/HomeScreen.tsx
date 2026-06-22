import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSessions, getTemplates } from '../storage/storage';
import { WorkoutSession, WorkoutTemplate } from '../types';
import { COLORS, CARD_SHADOW } from '../theme';

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

// ─── helpers ────────────────────────────────────────────────────────────────

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
    if (days.has(d.toISOString().slice(0, 10))) streak++;
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

function getNextWorkout(templates: WorkoutTemplate[]): { template: WorkoutTemplate; daysAway: number } | null {
  const dow = new Date().getDay();
  for (let i = 1; i <= 7; i++) {
    const next = (dow + i) % 7;
    const planId = PLAN_DAY_MAP[next];
    if (planId) {
      const t = templates.find(t => t.id === planId);
      if (t) return { template: t, daysAway: i };
    }
  }
  return null;
}

function getPersonalRecords(sessions: WorkoutSession[]) {
  const records: Record<string, { weight: number; reps: number; exerciseName: string }> = {};
  sessions.forEach(s =>
    s.exercises.forEach(ex =>
      ex.sets.forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        if (w > 0) {
          const key = ex.exercise.id;
          if (!records[key] || w > records[key].weight || (w === records[key].weight && r > records[key].reps)) {
            records[key] = { weight: w, reps: r, exerciseName: ex.exercise.name };
          }
        }
      })
    )
  );
  return Object.values(records)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}

function getVolumeComparison(sessions: WorkoutSession[]) {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const vol = (list: WorkoutSession[]) =>
    list.reduce((t, s) =>
      t + s.exercises.reduce((te, ex) =>
        te + ex.sets.reduce((ts, set) =>
          ts + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0), 0);

  const thisWeek = vol(sessions.filter(s => new Date(s.date) >= thisWeekStart));
  const lastWeek = vol(sessions.filter(s => {
    const d = new Date(s.date);
    return d >= lastWeekStart && d < thisWeekStart;
  }));
  return { thisWeek, lastWeek };
}

function getBestSession(sessions: WorkoutSession[]) {
  if (!sessions.length) return null;
  return sessions.reduce((best, s) => {
    const vol = s.exercises.reduce((t, ex) =>
      t + ex.sets.reduce((ts, set) =>
        ts + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);
    const bestVol = best.exercises.reduce((t, ex) =>
      t + ex.sets.reduce((ts, set) =>
        ts + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);
    return vol > bestVol ? s : best;
  }, sessions[0]);
}

// ─── component ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);

  useFocusEffect(
    useCallback(() => {
      const dow = new Date().getDay();
      const planId = PLAN_DAY_MAP[dow];
      Promise.all([getSessions(), getTemplates()]).then(([sess, tmpl]) => {
        setSessions(sess);
        setTemplates(tmpl);
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
  const weekDone = new Set(thisWeekSessions.map(s => new Date(s.date).getDay()));
  const todayKey = now.toISOString().slice(0, 10);
  const todaySession = sessions.find(s => s.date.slice(0, 10) === todayKey);

  // Insights
  const nextWorkout = getNextWorkout(templates);
  const prs = getPersonalRecords(sessions);
  const { thisWeek: volThis, lastWeek: volLast } = getVolumeComparison(sessions);
  const volDiff = volLast > 0 ? Math.round(((volThis - volLast) / volLast) * 100) : null;
  const bestSession = getBestSession(sessions);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

      {/* ── Gradient header ──────────────────────────────────────────── */}
      <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.header}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
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

        {/* ── Today card ───────────────────────────────────────────────── */}
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

        {/* ── Week strip ───────────────────────────────────────────────── */}
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
                      : isPlanned ? <View style={styles.dayDotInner} /> : null}
                  </View>
                </View>
              );
            })}
          </View>
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

        {/* ── INSIGHTS header ──────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <Text style={styles.insightsHeader}>Insights</Text>
        )}

        {/* ── Next workout ─────────────────────────────────────────────── */}
        {nextWorkout && (
          <View style={[styles.card, styles.nextCard]}>
            <View style={styles.nextLeft}>
              <Text style={styles.nextBadge}>
                {nextWorkout.daysAway === 1 ? 'TOMORROW' : `IN ${nextWorkout.daysAway} DAYS`}
              </Text>
              <Text style={styles.nextName}>{nextWorkout.template.name}</Text>
              <Text style={styles.nextMeta}>
                {nextWorkout.template.exercises.length} exercises  ·  {nextWorkout.template.exercises.reduce((t, e) => t + (e.defaultSets ?? 3), 0)} sets
              </Text>
            </View>
            <View style={styles.nextIcon}>
              <Ionicons name="arrow-forward-circle" size={36} color={COLORS.primary} />
            </View>
          </View>
        )}

        {/* ── Volume trend ─────────────────────────────────────────────── */}
        {(volThis > 0 || volLast > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Volume This Week</Text>
            <View style={styles.volRow}>
              <View style={styles.volBlock}>
                <Text style={styles.volValue}>{Math.round(volThis).toLocaleString()}</Text>
                <Text style={styles.volLabel}>kg lifted</Text>
              </View>
              {volDiff !== null && (
                <View style={[styles.volBadge, volDiff >= 0 ? styles.volBadgeUp : styles.volBadgeDown]}>
                  <Ionicons
                    name={volDiff >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={volDiff >= 0 ? COLORS.success : COLORS.danger}
                  />
                  <Text style={[styles.volBadgeText, { color: volDiff >= 0 ? COLORS.success : COLORS.danger }]}>
                    {volDiff >= 0 ? '+' : ''}{volDiff}% vs last week
                  </Text>
                </View>
              )}
            </View>
            {volLast > 0 && (
              <Text style={styles.volCompare}>
                Last week: {Math.round(volLast).toLocaleString()} kg
              </Text>
            )}
          </View>
        )}

        {/* ── Personal Records ─────────────────────────────────────────── */}
        {prs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
            {prs.map((pr, i) => (
              <View key={i} style={[styles.prRow, i < prs.length - 1 && styles.prRowBorder]}>
                <View style={styles.prRank}>
                  <Text style={styles.prRankText}>{i + 1}</Text>
                </View>
                <Text style={styles.prName} numberOfLines={1}>{pr.exerciseName}</Text>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
                {pr.reps > 0 && <Text style={styles.prReps}>× {pr.reps}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* ── Best session ─────────────────────────────────────────────── */}
        {bestSession && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>⚡ Best Session</Text>
            <View style={styles.bestRow}>
              <View style={styles.bestIcon}>
                <Ionicons name="trophy" size={22} color={COLORS.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bestName}>{bestSession.templateName}</Text>
                <Text style={styles.bestMeta}>
                  {new Date(bestSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {'  ·  '}{bestSession.duration}m
                  {'  ·  '}{bestSession.exercises.length} exercises
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Last workout ─────────────────────────────────────────────── */}
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

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  dateText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  headerStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 4 },

  body: { padding: 16, marginTop: -16 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 18, marginBottom: 14, ...CARD_SHADOW },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 14 },

  // Today / workout card
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

  // Rest day
  restCard: { alignItems: 'center', paddingVertical: 28 },
  restEmoji: { fontSize: 40, marginBottom: 10 },
  restTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  restSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },

  // Week strip
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '500' },
  dayLabelToday: { color: COLORS.primary, fontWeight: '700' },
  dayDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center' },
  dayDotDone: { backgroundColor: COLORS.success },
  dayDotToday: { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary },
  dayDotRest: { backgroundColor: COLORS.inputBg },
  dayDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  legend: { flexDirection: 'row', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 11, color: COLORS.muted },

  // Insights section label
  insightsHeader: {
    fontSize: 20, fontWeight: '800', color: COLORS.white,
    marginBottom: 12, marginTop: 4,
  },

  // Next workout
  nextCard: { borderLeftWidth: 4, borderLeftColor: COLORS.amber, flexDirection: 'row', alignItems: 'center' },
  nextLeft: { flex: 1 },
  nextBadge: { fontSize: 11, fontWeight: '700', color: COLORS.amber, letterSpacing: 1, marginBottom: 6 },
  nextName: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  nextMeta: { fontSize: 12, color: COLORS.muted },
  nextIcon: { marginLeft: 12 },

  // Volume trend
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  volBlock: {},
  volValue: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  volLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  volBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  volBadgeUp: { backgroundColor: COLORS.successLight },
  volBadgeDown: { backgroundColor: COLORS.dangerLight },
  volBadgeText: { fontSize: 12, fontWeight: '600' },
  volCompare: { fontSize: 12, color: COLORS.muted, marginTop: 10 },

  // Personal records
  prRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  prRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  prRank: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  prRankText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  prName: { flex: 1, fontSize: 14, color: COLORS.white, fontWeight: '500' },
  prWeight: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginLeft: 8 },
  prReps: { fontSize: 13, color: COLORS.muted, marginLeft: 4 },

  // Best session
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bestIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.amberLight, alignItems: 'center', justifyContent: 'center' },
  bestName: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  bestMeta: { fontSize: 12, color: COLORS.muted, marginTop: 3 },

  // Last workout
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lastIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  lastName: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  lastMeta: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
});
