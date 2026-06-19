import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '../storage/storage';
import { BodyMeasurement } from '../types';
import { COLORS } from '../theme';
import { alertMsg, alertConfirm } from '../utils/alert';

const { width } = Dimensions.get('window');

const FIELDS: { key: keyof Omit<BodyMeasurement, 'id' | 'date' | 'notes'>; label: string; unit: string }[] = [
  { key: 'weight', label: 'Body Weight', unit: 'kg' },
  { key: 'leftArm', label: 'Left Arm', unit: 'cm' },
  { key: 'rightArm', label: 'Right Arm', unit: 'cm' },
  { key: 'waistRelaxed', label: 'Waist Relaxed', unit: 'cm' },
  { key: 'waistFlexed', label: 'Waist Flexed', unit: 'cm' },
  { key: 'rightThigh', label: 'Right Thigh', unit: 'cm' },
  { key: 'leftThigh', label: 'Left Thigh', unit: 'cm' },
];

function toDateInput(iso: string) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function dateInputToIso(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShort(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const emptyForm = (): Omit<BodyMeasurement, 'id' | 'date'> => ({
  weight: '', leftArm: '', rightArm: '',
  waistRelaxed: '', waistFlexed: '', rightThigh: '', leftThigh: '', notes: '',
});

export default function BodyScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [chartField, setChartField] = useState<typeof FIELDS[0]>(FIELDS[0]);

  useFocusEffect(
    useCallback(() => {
      getMeasurements().then(setMeasurements);
    }, [])
  );

  const openAdd = () => {
    setEditingId(null);
    setFormDate(toDateInput(new Date().toISOString()));
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (m: BodyMeasurement) => {
    setEditingId(m.id);
    setFormDate(toDateInput(m.date));
    setForm({
      weight: m.weight, leftArm: m.leftArm, rightArm: m.rightArm,
      waistRelaxed: m.waistRelaxed, waistFlexed: m.waistFlexed,
      rightThigh: m.rightThigh, leftThigh: m.leftThigh, notes: m.notes,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    const hasData = FIELDS.some(f => form[f.key].trim() !== '');
    if (!hasData) { alertMsg('Enter at least one measurement'); return; }
    const m: BodyMeasurement = {
      id: editingId ?? Date.now().toString(),
      date: dateInputToIso(formDate),
      ...form,
    };
    await saveMeasurement(m);
    const updated = await getMeasurements();
    setMeasurements(updated);
    closeForm();
  };

  const handleDelete = (id: string) => {
    alertConfirm('Delete Entry', 'Remove this measurement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteMeasurement(id);
          setMeasurements(prev => prev.filter(m => m.id !== id));
        },
      },
    ]);
  };

  const chartPoints = [...measurements]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(m => m[chartField.key] !== '')
    .slice(-10);

  const hasChart = chartPoints.length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Chart */}
        {measurements.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{chartField.label} over time</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldPicker}>
              {FIELDS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.fieldBtn, chartField.key === f.key && styles.fieldBtnActive]}
                  onPress={() => setChartField(f)}
                >
                  <Text style={[styles.fieldBtnText, chartField.key === f.key && styles.fieldBtnTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {hasChart ? (
              <LineChart
                data={{
                  labels: chartPoints.map(m => formatShort(m.date)),
                  datasets: [{ data: chartPoints.map(m => parseFloat(m[chartField.key]) || 0) }],
                }}
                width={width - 64}
                height={180}
                chartConfig={{
                  backgroundColor: COLORS.card,
                  backgroundGradientFrom: COLORS.card,
                  backgroundGradientTo: COLORS.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                  labelColor: () => COLORS.muted,
                  propsForDots: { r: '5', strokeWidth: '2', stroke: '#F59E0B' },
                }}
                bezier
                style={{ borderRadius: 10, marginTop: 8 }}
              />
            ) : (
              <Text style={styles.noChart}>
                {chartPoints.length === 0
                  ? `No ${chartField.label} data yet.`
                  : 'Need at least 2 entries to show chart.'}
              </Text>
            )}
          </View>
        )}

        {/* History */}
        <Text style={styles.historyLabel}>
          {measurements.length === 0 ? 'No entries yet. Tap + to add measurements.' : 'History'}
        </Text>

        {measurements.map(m => (
          <View key={m.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatDate(m.date)}</Text>
              <View style={styles.entryActions}>
                <TouchableOpacity onPress={() => openEdit(m)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(m.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.entryGrid}>
              {FIELDS.filter(f => m[f.key] !== '').map(f => (
                <View key={f.key} style={styles.entryCell}>
                  <Text style={styles.entryCellVal}>{m[f.key]} {f.unit}</Text>
                  <Text style={styles.entryCellLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
            {m.notes ? <Text style={styles.entryNotes}>{m.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>

      {/* Add / Edit Measurement Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Measurements' : 'Add Measurements'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {/* Date field */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={[styles.input, { minWidth: 130, textAlign: 'right' }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.muted}
                  value={formDate}
                  onChangeText={setFormDate}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>

              {FIELDS.map(f => (
                <View key={f.key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="—"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="decimal-pad"
                      value={form[f.key]}
                      onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    />
                    <Text style={styles.unit}>{f.unit}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, { flex: 1, textAlign: 'left' }]}
                  placeholder="Optional notes..."
                  placeholderTextColor={COLORS.muted}
                  value={form.notes}
                  onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                  multiline
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  addBtn: {
    backgroundColor: COLORS.primary, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  chartCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  chartHeader: { marginBottom: 8 },
  chartTitle: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  fieldPicker: { marginBottom: 4 },
  fieldBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.inputBg, marginRight: 8,
  },
  fieldBtnActive: { backgroundColor: '#F59E0B' },
  fieldBtnText: { fontSize: 12, color: COLORS.muted },
  fieldBtnTextActive: { color: COLORS.bg, fontWeight: '600' },
  noChart: { color: COLORS.muted, textAlign: 'center', paddingVertical: 30, fontSize: 14 },
  historyLabel: { fontSize: 14, color: COLORS.muted, marginBottom: 10 },
  entryCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryDate: { fontSize: 14, fontWeight: '600', color: COLORS.white, flex: 1 },
  entryActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  entryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryCell: { minWidth: '40%' },
  entryCellVal: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  entryCellLabel: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  entryNotes: { fontSize: 13, color: COLORS.muted, marginTop: 10, fontStyle: 'italic' },
  // Modal
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: COLORS.white },
  cancelText: { fontSize: 16, color: COLORS.muted },
  saveText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  formScroll: { padding: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  fieldLabel: { fontSize: 15, color: COLORS.white, flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    backgroundColor: COLORS.inputBg, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    color: COLORS.white, fontSize: 15, textAlign: 'right', minWidth: 80,
  },
  unit: { fontSize: 13, color: COLORS.muted, width: 28 },
});
