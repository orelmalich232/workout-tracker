import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { getSessions, getAllExercises } from '../storage/storage';
import { WorkoutSession, ExerciseTemplate } from '../types';
import { COLORS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const allExercises = getAllExercises();

  useFocusEffect(
    useCallback(() => {
      getSessions().then(d => {
        setSessions(d);
        if (!selectedExercise && d.length > 0) {
          // pick first exercise that has data
          for (const s of d) {
            if (s.exercises.length > 0) {
              setSelectedExercise(s.exercises[0].exercise);
              break;
            }
          }
        }
      });
    }, [])
  );

  // Aggregate: for each session that has the selected exercise, find max weight
  const chartData = useMemo(() => {
    if (!selectedExercise) return null;
    const points: { date: string; maxWeight: number; maxVolume: number }[] = [];
    const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const s of sorted) {
      const ex = s.exercises.find(e => e.exercise.id === selectedExercise.id);
      if (!ex) continue;
      let maxW = 0;
      let totalVol = 0;
      ex.sets.forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        if (w > maxW) maxW = w;
        totalVol += w * r;
      });
      if (maxW > 0) {
        points.push({ date: s.date, maxWeight: maxW, maxVolume: totalVol });
      }
    }
    return points.slice(-10); // last 10 sessions
  }, [sessions, selectedExercise]);

  // Summary stats
  const totalWorkouts = sessions.length;
  const thisWeek = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const totalVolume = sessions.reduce((acc, s) =>
    acc + s.exercises.reduce((a, ex) =>
      a + ex.sets.reduce((b, set) => b + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0), 0);

  const hasChart = chartData && chartData.length >= 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Progress</Text>

      {/* Summary cards */}
      <View style={styles.statsRow}>
        <StatCard label="Total Workouts" value={`${totalWorkouts}`} icon="barbell" />
        <StatCard label="This Week" value={`${thisWeek}`} icon="calendar" />
        <StatCard label="Total Volume" value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '0'} icon="trending-up" />
      </View>

      {/* Exercise progress chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercise Progress</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.pickerText} numberOfLines={1}>
              {selectedExercise ? selectedExercise.name : 'Select exercise'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.noData}>
            <Ionicons name="stats-chart-outline" size={40} color={COLORS.muted} />
            <Text style={styles.noDataText}>Complete workouts to see progress.</Text>
          </View>
        ) : !hasChart ? (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>
              {selectedExercise
                ? `Need at least 2 sessions with ${selectedExercise.name} to show a chart.`
                : 'Select an exercise to see progress.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.chartLabel}>Max Weight (kg)</Text>
            <LineChart
              data={{
                labels: chartData.map(d => formatDateShort(d.date)),
                datasets: [{ data: chartData.map(d => d.maxWeight) }],
              }}
              width={width - 32}
              height={200}
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: () => COLORS.muted,
                style: { borderRadius: 12 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.primary },
              }}
              bezier
              style={{ borderRadius: 12, marginTop: 4 }}
            />
            <Text style={[styles.chartLabel, { marginTop: 20 }]}>Volume (kg)</Text>
            <LineChart
              data={{
                labels: chartData.map(d => formatDateShort(d.date)),
                datasets: [{ data: chartData.map(d => d.maxVolume) }],
              }}
              width={width - 32}
              height={180}
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: () => COLORS.muted,
                propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.success },
              }}
              bezier
              style={{ borderRadius: 12, marginTop: 4 }}
            />
          </>
        )}
      </View>

      {/* Exercise picker */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allExercises}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exRow}
                onPress={() => { setSelectedExercise(item); setShowPicker(false); }}
              >
                <View>
                  <Text style={styles.exName}>{item.name}</Text>
                  <Text style={styles.exCat}>{item.category}</Text>
                </View>
                {selectedExercise?.id === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={cardStyles.card}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <Text style={cardStyles.value}>{value}</Text>
      <Text style={cardStyles.label}>{label}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 4,
  },
  value: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  label: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  section: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, maxWidth: 160,
  },
  pickerText: { color: COLORS.primary, fontSize: 13, fontWeight: '500', flex: 1 },
  chartLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  noData: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noDataText: { color: COLORS.muted, textAlign: 'center', fontSize: 14 },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: COLORS.white },
  exRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  exName: { fontSize: 15, color: COLORS.white },
  exCat: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
