import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveSession } from '../storage/storage';
import { WorkoutSession, ExerciseSession, SetEntry } from '../types';
import { COLORS } from '../theme';
import { alertConfirm } from '../utils/alert';

export default function ActiveWorkoutScreen({ route, navigation }: any) {
  const { template } = route.params;
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<ExerciseSession[]>(
    template.exercises.map((ex: ExerciseSession['exercise'] & { defaultSets?: number }) => ({
      exercise: ex,
      sets: Array.from(
        { length: ex.defaultSets ?? 3 },
        () => ({ weight: '', reps: '', completed: false })
      ),
    }))
  );

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string | boolean) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
          : ex
      )
    );
  };

  const addSet = (exIdx: number) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: [...ex.sets, { weight: '', reps: '', completed: false }] }
          : ex
      )
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      )
    );
  };

  const handleFinish = () => {
    alertConfirm('Finish Workout?', 'Save this workout session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save', onPress: async () => {
          const session: WorkoutSession = {
            id: Date.now().toString(),
            templateId: template.id,
            templateName: template.name,
            date: new Date().toISOString(),
            duration: Math.floor(elapsed / 60),
            exercises,
          };
          await saveSession(session);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDiscard = () => {
    alertConfirm('Discard Workout?', 'This session will not be saved.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        <View style={styles.timerBox}>
          <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.workoutName}>{template.name}</Text>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {exercises.map((ex, exIdx) => (
          <View key={ex.exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
            <Text style={styles.category}>{ex.exercise.category}</Text>

            {/* Header: Set | ✓ | Weight | Reps */}
            <View style={styles.setHeader}>
              <Text style={[styles.setCol, { width: 28 }]}>#</Text>
              <Text style={[styles.setCol, { width: 48 }]}>Done</Text>
              <Text style={[styles.setCol, { flex: 1 }]}>Weight (kg)</Text>
              <Text style={[styles.setCol, { flex: 1 }]}>Reps</Text>
            </View>

            {ex.sets.map((set, setIdx) => (
              <View key={setIdx} style={styles.setRow}>
                {/* Set number */}
                <Text style={[styles.setNum, { width: 28 }]}>{setIdx + 1}</Text>

                {/* Done checkbox — moved left for easy thumb access */}
                <TouchableOpacity
                  style={[styles.checkBtn, set.completed && styles.checkBtnActive, { width: 48 }]}
                  onPress={() => updateSet(exIdx, setIdx, 'completed', !set.completed)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="checkmark" size={18} color={set.completed ? '#FFFFFF' : COLORS.muted} />
                </TouchableOpacity>

                {/* Weight */}
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="0"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="decimal-pad"
                  value={set.weight}
                  onChangeText={v => updateSet(exIdx, setIdx, 'weight', v)}
                />

                {/* Reps */}
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="0"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  value={set.reps}
                  onChangeText={v => updateSet(exIdx, setIdx, 'reps', v)}
                />

                {/* Remove */}
                {ex.sets.length > 1 && (
                  <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)} style={styles.removeSet}>
                    <Ionicons name="remove-circle-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  discardText: { color: COLORS.muted, fontSize: 15 },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timer: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  finishBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  finishText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  workoutName: { fontSize: 22, fontWeight: '700', color: COLORS.white, paddingHorizontal: 16, paddingVertical: 12 },
  scroll: { paddingHorizontal: 16 },
  exerciseCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 14 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  category: { fontSize: 12, color: COLORS.primary, marginTop: 2, marginBottom: 10 },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setCol: { fontSize: 11, color: COLORS.muted, fontWeight: '500', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setNum: { color: COLORS.muted, textAlign: 'center', fontSize: 14 },
  input: {
    backgroundColor: COLORS.inputBg, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
    color: COLORS.white, fontSize: 15, marginHorizontal: 4, textAlign: 'center',
  },
  checkBtn: {
    height: 36, borderRadius: 8, borderWidth: 2,
    borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  checkBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  removeSet: { paddingLeft: 4, paddingRight: 2 },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, marginTop: 4 },
  addSetText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
});
