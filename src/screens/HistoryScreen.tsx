import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSessions, deleteSession } from '../storage/storage';
import { WorkoutSession } from '../types';
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

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  const handleDelete = (id: string) => {
    alertConfirm('Delete Session', 'Remove this workout from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSession(id);
          setSessions(prev => prev.filter(s => s.id !== id));
          setSelected(null);
        },
      },
    ]);
  };

  const totalVolume = (session: WorkoutSession) => {
    let vol = 0;
    session.exercises.forEach(ex =>
      ex.sets.forEach(s => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        vol += w * r;
      })
    );
    return vol;
  };

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
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
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

      {/* Session Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>{selected.templateName}</Text>
                <Text style={styles.modalDate}>{formatDate(selected.date)} · {selected.duration}m</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(selected.id)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {selected.exercises.map((ex, i) => (
                <View key={i} style={styles.exCard}>
                  <Text style={styles.exName}>{ex.exercise.name}</Text>
                  <View style={styles.setTableHeader}>
                    <Text style={styles.setHeaderCell}>Set</Text>
                    <Text style={styles.setHeaderCell}>Weight</Text>
                    <Text style={styles.setHeaderCell}>Reps</Text>
                    <Text style={styles.setHeaderCell}>Done</Text>
                  </View>
                  {ex.sets.map((s, j) => (
                    <View key={j} style={styles.setTableRow}>
                      <Text style={styles.setCell}>{j + 1}</Text>
                      <Text style={styles.setCell}>{s.weight ? `${s.weight} kg` : '-'}</Text>
                      <Text style={styles.setCell}>{s.reps || '-'}</Text>
                      <Ionicons
                        name={s.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={s.completed ? COLORS.success : COLORS.muted}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
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
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12,
  },
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
  exCard: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '600', color: COLORS.white, marginBottom: 10 },
  setTableHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  setHeaderCell: { fontSize: 11, color: COLORS.muted, flex: 1, textAlign: 'center' },
  setTableRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 6 },
  setCell: { fontSize: 14, color: COLORS.white, flex: 1, textAlign: 'center' },
});
