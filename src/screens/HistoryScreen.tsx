import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSessions, deleteSession, saveSession } from '../storage/storage';
import { WorkoutSession, SetEntry } from '../types';
import { COLORS } from '../theme';
import { alertConfirm } from '../utils/alert';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSession, setEditedSession] = useState<WorkoutSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  const openSession = (s: WorkoutSession) => {
    setSelected(s);
    setEditMode(false);
    setEditedSession(null);
  };

  const closeModal = () => {
    setSelected(null);
    setEditMode(false);
    setEditedSession(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setEditedSession(JSON.parse(JSON.stringify(selected)));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedSession(null);
  };

  const updateEditSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string | boolean) => {
    setEditedSession(prev => {
      if (!prev) return prev;
      const next: WorkoutSession = JSON.parse(JSON.stringify(prev));
      (next.exercises[exIdx].sets[setIdx] as any)[field] = value;
      return next;
    });
  };

  const saveEdit = async () => {
    if (!editedSession) return;
    await saveSession(editedSession);
    setSessions(prev => prev.map(s => s.id === editedSession.id ? editedSession : s));
    setSelected(editedSession);
    setEditMode(false);
    setEditedSession(null);
  };

  const handleDelete = (id: string) => {
    alertConfirm('Delete Session', 'Remove this workout from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSession(id);
          setSessions(prev => prev.filter(s => s.id !== id));
          closeModal();
        },
      },
    ]);
  };

  const totalVolume = (session: WorkoutSession) => {
    let vol = 0;
    session.exercises.forEach(ex =>
      ex.sets.forEach(s => { vol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0); })
    );
    return vol;
  };

  const displaySession = editMode ? editedSession : selected;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="barbell-outline" size={48} color={COLORS.muted} />
            <Text style={styles.empty}>No workouts yet.</Text>
            <Text style={styles.emptySub}>Complete your first workout to see it here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const vol = totalVolume(item);
          const completedSets = item.exercises.reduce(
            (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
          );
          const totalSets = item.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
          return (
            <TouchableOpacity style={styles.card} onPress={() => openSession(item)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardName}>{item.templateName}</Text>
                  <Text style={styles.cardDate}>{formatDate(item.date)} · {formatTime(item.date)}</Text>
                </View>
                <Text style={styles.duration}>{item.duration}m</Text>
              </View>
              <View style={styles.cardStats}>
                <Stat label="Exercises" value={`${item.exercises.length}`} />
                <Stat label="Sets Done" value={`${completedSets}/${totalSets}`} />
                {vol > 0 && <Stat label="Volume" value={`${vol.toLocaleString()} kg`} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Session Detail / Edit Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && displaySession && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                {editMode ? (
                  <>
                    <TouchableOpacity onPress={cancelEdit}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Edit Workout</Text>
                    <TouchableOpacity onPress={saveEdit}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.modalTitle}>{selected.templateName}</Text>
                      <Text style={styles.modalDate}>{formatDate(selected.date)} · {selected.duration}m</Text>
                    </View>
                    <TouchableOpacity onPress={startEdit} style={styles.editIconBtn}>
                      <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(selected.id)} style={{ marginLeft: 16 }}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="always">
                {displaySession.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={styles.exCard}>
                    <Text style={styles.exName}>{ex.exercise.name}</Text>

                    {/* Table header */}
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.setHeaderCell, { width: 30 }]}>Set</Text>
                      <Text style={[styles.setHeaderCell, { flex: 1 }]}>Weight (kg)</Text>
                      <Text style={[styles.setHeaderCell, { flex: 1 }]}>Reps</Text>
                      <Text style={[styles.setHeaderCell, { width: 44 }]}>Done</Text>
                    </View>

                    {ex.sets.map((s, setIdx) => (
                      <View key={setIdx} style={styles.setTableRow}>
                        <Text style={[styles.setCell, { width: 30 }]}>{setIdx + 1}</Text>

                        {editMode ? (
                          <>
                            <TextInput
                              style={[styles.editInput, { flex: 1 }]}
                              value={s.weight}
                              onChangeText={v => updateEditSet(exIdx, setIdx, 'weight', v)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={COLORS.muted}
                            />
                            <TextInput
                              style={[styles.editInput, { flex: 1 }]}
                              value={s.reps}
                              onChangeText={v => updateEditSet(exIdx, setIdx, 'reps', v)}
                              keyboardType="number-pad"
                              placeholder="0"
                              placeholderTextColor={COLORS.muted}
                            />
                            <TouchableOpacity
                              style={[styles.editCheckBtn, s.completed && styles.editCheckBtnActive]}
                              onPress={() => updateEditSet(exIdx, setIdx, 'completed', !s.completed)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="checkmark" size={16} color={s.completed ? '#FFF' : COLORS.muted} />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.setCell, { flex: 1 }]}>{s.weight ? `${s.weight} kg` : '-'}</Text>
                            <Text style={[styles.setCell, { flex: 1 }]}>{s.reps || '-'}</Text>
                            <Ionicons
                              name={s.completed ? 'checkmark-circle' : 'ellipse-outline'}
                              size={18}
                              color={s.completed ? COLORS.success : COLORS.muted}
                            />
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { alignItems: 'center' },
  value: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  label: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white, padding: 16, paddingBottom: 12 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 8 },
  empty: { color: COLORS.white, fontSize: 17, fontWeight: '600' },
  emptySub: { color: COLORS.muted, fontSize: 14 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  cardDate: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
  duration: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  cardStats: { flexDirection: 'row', gap: 24 },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: COLORS.white },
  modalDate: { fontSize: 12, color: COLORS.muted },
  cancelText: { fontSize: 16, color: COLORS.muted },
  saveText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  editIconBtn: { marginLeft: 8 },
  exCard: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '600', color: COLORS.white, marginBottom: 10 },
  setTableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setHeaderCell: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  setTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  setCell: { fontSize: 14, color: COLORS.white, textAlign: 'center' },
  editInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8,
    color: COLORS.white, fontSize: 14, textAlign: 'center', marginHorizontal: 3,
  },
  editCheckBtn: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center',
    marginLeft: 3,
  },
  editCheckBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
});
