import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSessions, getTemplates } from '../storage/storage';
import { WorkoutSession, WorkoutTemplate } from '../types';
import { COLORS, CARD_SHADOW } from '../theme';

const PLAN_DAY_MAP: Record<number, string> = {
  0: 'plan-a',
  2: 'plan-b',
  4: 'plan-c',
  6: 'plan-d',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REST_MESSAGES = [
  'Recovery is part of the process.',
  'Your muscles grow on rest days.',
  'Rest today, perform better tomorrow.',
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
  return `${diff} days ago`;
}

function getNextWorkout(templates: WorkoutTemplate[]) {
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
  const records: Record<string, { weight: number; reps: number; name: string }> = {};
  sessions.forEach(s =>
    s.exercises.forEach(ex =>
      ex.sets.forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        if (w > 0) {
          const key = ex.exercise.id;
          if (!records[key] || w > records[key].weight || (w === records[key].weight && r > records[key].reps))
            records[key] = { weight: w, reps: r, name: ex.exercise.name };
        }
      })
    )
  );
  return Object.values(records).sort((a, b) => b.weight - a.weight).slice(0, 5);
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
  return {
    thisWeek: vol(sessions.filter(s => new Date(s.date) >= thisWeekStart)),
    lastWeek: vol(sessions.filter(s => { const d = new Date(s.date); return d >= lastWeekStart && d < thisWeekStart; })),
  };
}

function getBestSession(sessions: WorkoutSession[]) {
  if (!sessions.length) return null;
  const vol = (s: WorkoutSession) =>
    s.exercises.reduce((t, ex) =>
      t + ex.sets.reduce((ts, set) =>
        ts + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);
  return sessions.reduce((best, s) => vol(s) > vol(best) ? s : best, sessions[0]);
}

// ─── small reusable pieces ───────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function IconBox({ name }: { name: any }) {
  return (
    <View style={styles.iconBox}>
      <Ionicons name={name} size={20} color={COLORS.primary} />
    </View>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

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
  const weekDone = new Set(thisWeekSessions.map(s => new Date(s.date).getDay()));
  const todayKey = now.toISOString().slice(0, 10);
  const todaySession = sessions.find(s => s.date.slice(0, 10) === todayKey);
  const nextWorkout = getNextWorkout(templates);
  const prs = getPersonalRecords(sessions);
  const { thisWeek: volThis, lastWeek: volLast } = getVolumeComparison(sessions);
  const volDiff = volLast > 0 ? Math.round(((volThis - volLast) / volLast) * 100) : null;
  const bestSession = getBestSession(sessions);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={styles.greeting}>{greeting()}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{thisWeekSessions.length}</Text>
            <Text style={styles.statLabel}>This week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>All time</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>

        {/* ── Today ──────────────────────────────────────────────────────── */}
        <SectionLabel text="Today" />

        {isWorkoutDay && todayTemplate ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{todayTemplate.name}</Text>
            <View style={styles.exercisePreview}>
              {todayTemplate.exercises.slice(0, 4).map((e) => (
                <View key={e.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseDot} />
                  <Text style={styles.exerciseName} numberOfLines={1}>{e.name}</Text>
                  <Text style={styles.exerciseSets}>{e.defaultSets ?? 3} sets</Text>
                </View>
              ))}
              {todayTemplate.exercises.length > 4 && (
                <Text style={styles.exerciseMore}>+{todayTemplate.exercises.length - 4} more exercises</Text>
              )}
            </View>
            {todaySession ? (
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={17} color={COLORS.success} />
                <Text style={styles.completedText}>Completed · {todaySession.duration} min</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('ActiveWorkout', { template: todayTemplate })}
              >
                <Ionicons name="play" size={15} color="#FFF" />
                <Text style={styles.startBtnText}>Start workout</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.restCard]}>
            <Ionicons name="moon-outline" size={26} color={COLORS.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Rest day</Text>
              <Text style={styles.restMessage}>{REST_MESSAGES[dow % REST_MESSAGES.length]}</Text>
            </View>
          </View>
        )}

        {/* ── This week ──────────────────────────────────────────────────── */}
        <SectionLabel text="This week" />
        <View style={styles.card}>
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
                    isToday && !done && isPlanned && styles.dayDotCurrent,
                    !isPlanned && !done && styles.dayDotRest,
                  ]}>
                    {done
                      ? <Ionicons name="checkmark" size={12} color="#FFF" />
                      : isPlanned && !done
                        ? <View style={[styles.dayDotPip, isToday && { backgroundColor: COLORS.primary }]} />
                        : null
                    }
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Insights ───────────────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <>
            <SectionLabel text="Insights" />

            {/* Next workout */}
            {nextWorkout && (
              <View style={styles.card}>
                <View style={styles.insightRow}>
                  <IconBox name="arrow-forward-circle-outline" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>Next workout</Text>
                    <Text style={styles.insightValue}>{nextWorkout.template.name}</Text>
                  </View>
                  <Text style={styles.insightRight}>
                    {nextWorkout.daysAway === 1 ? 'Tomorrow' : `In ${nextWorkout.daysAway}d`}
                  </Text>
                </View>
              </View>
            )}

            {/* Volume */}
            {(volThis > 0 || volLast > 0) && (
              <View style={styles.card}>
                <View style={styles.insightRow}>
                  <IconBox name="trending-up-outline" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>Volume this week</Text>
                    <Text style={styles.insightValue}>
                      {Math.round(volThis).toLocaleString()} kg
                      {volLast > 0 ? `  ·  ${Math.round(volLast).toLocaleString()} kg last week` : ''}
                    </Text>
                  </View>
                  {volDiff !== null && (
                    <View style={styles.trendTag}>
                      <Ionicons
                        name={volDiff >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={11}
                        color={volDiff >= 0 ? COLORS.success : COLORS.danger}
                      />
                      <Text style={[styles.trendTagText, { color: volDiff >= 0 ? COLORS.success : COLORS.danger }]}>
                        {Math.abs(volDiff)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Personal records */}
            {prs.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="trophy-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.cardHeaderText}>Personal bests</Text>
                </View>
                {prs.map((pr, i) => (
                  <View key={i} style={[styles.prRow, i < prs.length - 1 && styles.prRowDivider]}>
                    <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                    <Text style={styles.prWeight}>
                      {pr.weight} kg{pr.reps > 0 ? ` × ${pr.reps}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Best session */}
            {bestSession && (
              <View style={styles.card}>
                <View style={styles.insightRow}>
                  <IconBox name="star-outline" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>Best session</Text>
                    <Text style={styles.insightValue}>
                      {bestSession.templateName}  ·  {bestSession.duration} min  ·  {
                        new Date(bestSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Last workout */}
            <View style={styles.card}>
              <View style={styles.insightRow}>
                <IconBox name="time-outline" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>Last workout</Text>
                  <Text style={styles.insightValue}>
                    {sessions[0].templateName}  ·  {sessions[0].duration} min
                  </Text>
                </View>
                <Text style={styles.insightRight}>{lastWorkoutLabel(sessions)}</Text>
              </View>
            </View>
          </>
        )}

      </View>
    </ScrollView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.card,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dateText: { fontSize: 13, color: COLORS.muted, fontWeight: '500', marginBottom: 4 },
  greeting: { fontSize: 30, fontWeight: '800', color: COLORS.white, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  statLabel: { fontSize: 11, color: COLORS.muted },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  body: { padding: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.muted,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 18, marginBottom: 12, ...CARD_SHADOW,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, marginBottom: 14 },

  // Exercise preview
  exercisePreview: { gap: 10, marginBottom: 18 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  exerciseName: { flex: 1, fontSize: 14, color: COLORS.white },
  exerciseSets: { fontSize: 13, color: COLORS.muted },
  exerciseMore: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  // Rest day
  restCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  restMessage: { fontSize: 13, color: COLORS.muted, marginTop: 4 },

  // Buttons
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
  },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedText: { fontSize: 14, color: COLORS.success, fontWeight: '500' },

  // Week strip
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
  dayLabelToday: { color: COLORS.primary },
  dayDot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: COLORS.success },
  dayDotCurrent: { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary },
  dayDotRest: { backgroundColor: COLORS.bg },
  dayDotPip: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.muted },

  // Insight rows
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  insightLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 3 },
  insightValue: { fontSize: 14, fontWeight: '600', color: COLORS.white, lineHeight: 19 },
  insightRight: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },

  trendTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendTagText: { fontSize: 12, fontWeight: '700' },

  // Personal records card
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardHeaderText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  prRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  prRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  prName: { flex: 1, fontSize: 14, color: COLORS.white },
  prWeight: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
