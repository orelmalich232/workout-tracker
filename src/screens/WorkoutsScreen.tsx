import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates, saveTemplate, deleteTemplate, getAllExercises } from '../storage/storage';
import { WorkoutTemplate, ExerciseTemplate, TemplateExercise } from '../types';
import { COLORS } from '../theme';
import { alertMsg, alertConfirm } from '../utils/alert';

const CATEGORIES = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Calves', 'Core', 'Forearms', 'Full Body',
];

export default function WorkoutsScreen() {
  const navigation = useNavigation<any>();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = create new
  const [step, setStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<TemplateExercise[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const allExercises = getAllExercises();

  useFocusEffect(
    useCallback(() => {
      getTemplates().then(setTemplates);
    }, [])
  );

  const openCreate = () => {
    setEditingId(null);
    setNewName('');
    setSelectedExercises([]);
    setSearch('');
    setActiveCategory('All');
    setStep(1);
    setModalVisible(true);
  };

  const openEdit = (template: WorkoutTemplate) => {
    setEditingId(template.id);
    setNewName(template.name);
    setSelectedExercises(template.exercises.map(ex => ({
      ...ex,
      defaultSets: ex.defaultSets ?? 3,
    })));
    setSearch('');
    setActiveCategory('All');
    setStep(1);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNewName('');
    setSelectedExercises([]);
    setSearch('');
    setStep(1);
  };

  const handleSave = async () => {
    if (!newName.trim()) { alertMsg('Enter a workout name'); return; }
    if (selectedExercises.length === 0) { alertMsg('Add at least one exercise'); return; }
    const template: WorkoutTemplate = {
      id: editingId ?? Date.now().toString(),
      name: newName.trim(),
      exercises: selectedExercises,
    };
    await saveTemplate(template);
    setTemplates(prev =>
      editingId
        ? prev.map(t => t.id === editingId ? template : t)
        : [...prev, template]
    );
    closeModal();
  };

  const handleDelete = (id: string, name: string) => {
    alertConfirm('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTemplate(id);
          setTemplates(prev => prev.filter(t => t.id !== id));
        },
      },
    ]);
  };

  const toggleExercise = (ex: ExerciseTemplate) => {
    setSelectedExercises(prev =>
      prev.find(e => e.id === ex.id)
        ? prev.filter(e => e.id !== ex.id)
        : [...prev, { ...ex, defaultSets: 3 }]
    );
  };

  const adjustSets = (id: string, delta: number) => {
    setSelectedExercises(prev =>
      prev.map(e => e.id === id
        ? { ...e, defaultSets: Math.max(1, Math.min(10, (e.defaultSets ?? 3) + delta)) }
        : e
      )
    );
  };

  const filteredExercises = useMemo(() => {
    let list = activeCategory === 'All'
      ? allExercises
      : allExercises.filter(e => e.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search, allExercises]);

  const goNext = () => {
    if (!newName.trim()) { alertMsg('Enter a workout name first'); return; }
    if (selectedExercises.length === 0) { alertMsg('Select at least one exercise'); return; }
    setStep(2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Templates</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={t => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No templates yet. Tap + to create one.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.exercises.length} exercises</Text>
              <Text style={styles.cardExercises} numberOfLines={2}>
                {item.exercises.map(e => e.name).join(' · ')}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('ActiveWorkout', { template: item })}
              >
                <Ionicons name="play" size={14} color="#FFF" />
                <Text style={styles.startBtnText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id, item.name)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          {/* ── STEP 1: Select exercises ───────────────────────────────── */}
          {step === 1 && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingId ? 'Edit Template' : 'New Template'} (1/2)
                </Text>
                <TouchableOpacity onPress={goNext}>
                  <Text style={styles.saveText}>Next →</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.nameInput}
                placeholder="Workout name (e.g. Push Day)"
                placeholderTextColor={COLORS.muted}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.sectionLabel}>
                Select Exercises ({selectedExercises.length} selected)
              </Text>

              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={COLORS.muted}
                  value={search}
                  onChangeText={v => { setSearch(v); setActiveCategory('All'); }}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, activeCategory === cat && !search && styles.catBtnActive]}
                    onPress={() => { setActiveCategory(cat); setSearch(''); }}
                  >
                    <Text style={[styles.catText, activeCategory === cat && !search && styles.catTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <FlatList
                data={filteredExercises}
                keyExtractor={e => e.id}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.noResults}>No exercises found for "{search}"</Text>
                }
                renderItem={({ item }) => {
                  const selected = !!selectedExercises.find(e => e.id === item.id);
                  return (
                    <Pressable style={styles.exerciseRow} onPress={() => toggleExercise(item)}>
                      <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                        {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <Text style={styles.exerciseCat}>{item.category}</Text>
                      </View>
                    </Pressable>
                  );
                }}
              />

              {selectedExercises.length > 0 && (
                <View style={styles.selectedBar}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedExercises.map(ex => (
                      <TouchableOpacity
                        key={ex.id}
                        style={styles.selectedChip}
                        onPress={() => toggleExercise(ex)}
                      >
                        <Text style={styles.selectedChipText} numberOfLines={1}>{ex.name}</Text>
                        <Ionicons name="close" size={12} color={COLORS.primary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* ── STEP 2: Configure sets per exercise ───────────────────── */}
          {step === 2 && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.cancelText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Configure Sets (2/2)</Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.configHint}>
                Set the default number of sets for each exercise.
              </Text>

              <FlatList
                data={selectedExercises}
                keyExtractor={e => e.id}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <View style={styles.configRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.configName}>{item.name}</Text>
                      <Text style={styles.configCat}>{item.category}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustSets(item.id, -1)}
                      >
                        <Ionicons name="remove" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{item.defaultSets ?? 3}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustSets(item.id, 1)}
                      >
                        <Ionicons name="add" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepLabel}>sets</Text>
                    </View>
                  </View>
                )}
              />
            </>
          )}
        </View>
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
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 60, fontSize: 15 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '600', color: COLORS.white },
  cardSub: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  cardExercises: { fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 18 },
  cardActions: { alignItems: 'flex-end', gap: 6 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  startBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  iconBtn: { padding: 4 },
  // Modal
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  cancelText: { fontSize: 15, color: COLORS.muted },
  saveText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  nameInput: {
    margin: 16, marginBottom: 8, padding: 14, backgroundColor: COLORS.card,
    borderRadius: 10, color: COLORS.white, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionLabel: { paddingHorizontal: 16, marginBottom: 6, color: COLORS.muted, fontSize: 13 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: COLORS.white, fontSize: 15 },
  categoryBar: { paddingHorizontal: 16, marginBottom: 4 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.card, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: COLORS.muted, fontSize: 13 },
  catTextActive: { color: '#FFF', fontWeight: '600' },
  noResults: { color: COLORS.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: COLORS.border, marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  exerciseName: { color: COLORS.white, fontSize: 15 },
  exerciseCat: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  selectedBar: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.card,
  },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: COLORS.primary,
  },
  selectedChipText: { color: COLORS.primary, fontSize: 12, maxWidth: 120 },
  // Step 2
  configHint: { padding: 16, paddingBottom: 4, color: COLORS.muted, fontSize: 13 },
  configRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  configName: { fontSize: 15, fontWeight: '500', color: COLORS.white },
  configCat: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepValue: {
    fontSize: 18, fontWeight: '700', color: COLORS.white,
    minWidth: 28, textAlign: 'center',
  },
  stepLabel: { fontSize: 13, color: COLORS.muted, marginLeft: 2 },
});
