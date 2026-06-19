import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutTemplate, WorkoutSession, BodyMeasurement, ExerciseTemplate } from '../types';

const KEYS = {
  TEMPLATES: 'workout_templates',
  SESSIONS: 'workout_sessions',
  BODY: 'body_measurements',
};

const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  { id: 'c01', name: 'Barbell Bench Press', category: 'Chest' },
  { id: 'c02', name: 'Dumbbell Bench Press', category: 'Chest' },
  { id: 'c03', name: 'Smith Machine Bench Press', category: 'Chest' },
  { id: 'c04', name: 'Barbell Incline Bench Press', category: 'Chest' },
  { id: 'c05', name: 'Dumbbell Incline Bench Press', category: 'Chest' },
  { id: 'c06', name: 'Smith Machine Incline Bench Press', category: 'Chest' },
  { id: 'c07', name: 'Barbell Decline Bench Press', category: 'Chest' },
  { id: 'c08', name: 'Dumbbell Decline Bench Press', category: 'Chest' },
  { id: 'c09', name: 'Cable Chest Press', category: 'Chest' },
  { id: 'c10', name: 'Machine Chest Press', category: 'Chest' },
  { id: 'c11', name: 'Incline Machine Chest Press', category: 'Chest' },
  { id: 'c12', name: 'Dumbbell Fly', category: 'Chest' },
  { id: 'c13', name: 'Cable Fly (Low to High)', category: 'Chest' },
  { id: 'c14', name: 'Cable Fly (High to Low)', category: 'Chest' },
  { id: 'c15', name: 'Cable Fly (Mid)', category: 'Chest' },
  { id: 'c16', name: 'Incline Dumbbell Fly', category: 'Chest' },
  { id: 'c17', name: 'Pec Deck Machine', category: 'Chest' },
  { id: 'c18', name: 'Push-Up', category: 'Chest' },
  { id: 'c19', name: 'Wide Push-Up', category: 'Chest' },
  { id: 'c20', name: 'Diamond Push-Up', category: 'Chest' },
  { id: 'c21', name: 'Decline Push-Up', category: 'Chest' },
  { id: 'c22', name: 'Chest Dips', category: 'Chest' },
  { id: 'c23', name: 'Landmine Press', category: 'Chest' },
  { id: 'c24', name: 'Dumbbell Pullover', category: 'Chest' },
  { id: 'c25', name: 'Barbell Pullover', category: 'Chest' },
  { id: 'c26', name: 'Cable Pullover (Chest)', category: 'Chest' },
  { id: 'c27', name: 'Machine Pullover', category: 'Chest' },
  { id: 'c28', name: 'Svend Press', category: 'Chest' },
  { id: 'c29', name: 'Floor Press (Barbell)', category: 'Chest' },
  { id: 'c30', name: 'Floor Press (Dumbbell)', category: 'Chest' },

  // ── BACK ───────────────────────────────────────────────────────────────────
  { id: 'b01', name: 'Barbell Deadlift', category: 'Back' },
  { id: 'b02', name: 'Romanian Deadlift (Barbell)', category: 'Back' },
  { id: 'b03', name: 'Romanian Deadlift (Dumbbell)', category: 'Back' },
  { id: 'b04', name: 'Sumo Deadlift', category: 'Back' },
  { id: 'b05', name: 'Trap Bar Deadlift', category: 'Back' },
  { id: 'b06', name: 'Pull-Up', category: 'Back' },
  { id: 'b07', name: 'Chin-Up', category: 'Back' },
  { id: 'b08', name: 'Neutral Grip Pull-Up', category: 'Back' },
  { id: 'b09', name: 'Assisted Pull-Up (Machine)', category: 'Back' },
  { id: 'b10', name: 'Lat Pulldown (Wide Grip)', category: 'Back' },
  { id: 'b11', name: 'Lat Pulldown (Close Grip)', category: 'Back' },
  { id: 'b12', name: 'Lat Pulldown (Reverse Grip)', category: 'Back' },
  { id: 'b13', name: 'Lat Pulldown (Single Arm)', category: 'Back' },
  { id: 'b14', name: 'Barbell Bent-Over Row', category: 'Back' },
  { id: 'b15', name: 'Dumbbell Single-Arm Row', category: 'Back' },
  { id: 'b16', name: 'Cable Seated Row (Wide Grip)', category: 'Back' },
  { id: 'b17', name: 'Cable Seated Row (Close Grip)', category: 'Back' },
  { id: 'b18', name: 'Cable Standing Row', category: 'Back' },
  { id: 'b19', name: 'T-Bar Row', category: 'Back' },
  { id: 'b20', name: 'Machine Row', category: 'Back' },
  { id: 'b21', name: 'Chest-Supported Dumbbell Row', category: 'Back' },
  { id: 'b22', name: 'Pendlay Row', category: 'Back' },
  { id: 'b23', name: 'Meadows Row', category: 'Back' },
  { id: 'b24', name: 'Straight-Arm Pulldown', category: 'Back' },
  { id: 'b25', name: 'Back Extension (Machine)', category: 'Back' },
  { id: 'b26', name: 'Hyperextension (45°)', category: 'Back' },
  { id: 'b27', name: 'Good Morning', category: 'Back' },
  { id: 'b28', name: 'Rack Pull', category: 'Back' },
  { id: 'b29', name: 'Face Pull', category: 'Back' },
  { id: 'b30', name: 'Cable Pullover (Lat Focus)', category: 'Back' },
  { id: 'b31', name: 'Inverted Row', category: 'Back' },
  { id: 'b32', name: 'Seal Row', category: 'Back' },
  { id: 'b33', name: 'Kroc Row', category: 'Back' },
  { id: 'b34', name: 'Renegade Row', category: 'Back' },
  { id: 'b35', name: 'Cable Pullover (Straight-Arm)', category: 'Back' },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { id: 's01', name: 'Barbell Overhead Press', category: 'Shoulders' },
  { id: 's02', name: 'Dumbbell Overhead Press', category: 'Shoulders' },
  { id: 's03', name: 'Smith Machine Overhead Press', category: 'Shoulders' },
  { id: 's04', name: 'Machine Shoulder Press', category: 'Shoulders' },
  { id: 's05', name: 'Arnold Press', category: 'Shoulders' },
  { id: 's06', name: 'Dumbbell Lateral Raise', category: 'Shoulders' },
  { id: 's07', name: 'Cable Lateral Raise', category: 'Shoulders' },
  { id: 's08', name: 'Machine Lateral Raise', category: 'Shoulders' },
  { id: 's09', name: 'Dumbbell Front Raise', category: 'Shoulders' },
  { id: 's10', name: 'Barbell Front Raise', category: 'Shoulders' },
  { id: 's11', name: 'Cable Front Raise', category: 'Shoulders' },
  { id: 's12', name: 'Dumbbell Rear Delt Fly', category: 'Shoulders' },
  { id: 's13', name: 'Cable Rear Delt Fly', category: 'Shoulders' },
  { id: 's14', name: 'Machine Rear Delt (Pec Deck)', category: 'Shoulders' },
  { id: 's15', name: 'Barbell Upright Row', category: 'Shoulders' },
  { id: 's16', name: 'Dumbbell Upright Row', category: 'Shoulders' },
  { id: 's17', name: 'Cable Upright Row', category: 'Shoulders' },
  { id: 's18', name: 'Barbell Shrug', category: 'Shoulders' },
  { id: 's19', name: 'Dumbbell Shrug', category: 'Shoulders' },
  { id: 's20', name: 'Machine Shrug', category: 'Shoulders' },
  { id: 's21', name: 'Cable Face Pull', category: 'Shoulders' },
  { id: 's22', name: 'Landmine Lateral Raise', category: 'Shoulders' },
  { id: 's23', name: 'Bradford Press', category: 'Shoulders' },
  { id: 's24', name: 'Cable Y-Raise', category: 'Shoulders' },
  { id: 's25', name: 'Kettlebell Press', category: 'Shoulders' },
  { id: 's26', name: 'Plate Front Raise', category: 'Shoulders' },
  { id: 's27', name: 'Push Press', category: 'Shoulders' },
  { id: 's28', name: 'Single-Arm Cable Front Raise', category: 'Shoulders' },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  { id: 'bi01', name: 'Barbell Curl', category: 'Biceps' },
  { id: 'bi02', name: 'Dumbbell Curl', category: 'Biceps' },
  { id: 'bi03', name: 'Hammer Curl', category: 'Biceps' },
  { id: 'bi04', name: 'Incline Dumbbell Curl', category: 'Biceps' },
  { id: 'bi05', name: 'Concentration Curl', category: 'Biceps' },
  { id: 'bi06', name: 'Cable Curl', category: 'Biceps' },
  { id: 'bi07', name: 'Cable Hammer Curl (Rope)', category: 'Biceps' },
  { id: 'bi08', name: 'Barbell Preacher Curl', category: 'Biceps' },
  { id: 'bi09', name: 'Dumbbell Preacher Curl', category: 'Biceps' },
  { id: 'bi10', name: 'Machine Preacher Curl', category: 'Biceps' },
  { id: 'bi11', name: 'Spider Curl', category: 'Biceps' },
  { id: 'bi12', name: 'Barbell Reverse Curl', category: 'Biceps' },
  { id: 'bi13', name: 'Dumbbell Reverse Curl', category: 'Biceps' },
  { id: 'bi14', name: 'Zottman Curl', category: 'Biceps' },
  { id: 'bi15', name: 'Machine Curl', category: 'Biceps' },
  { id: 'bi16', name: 'EZ-Bar Curl', category: 'Biceps' },
  { id: 'bi17', name: 'Cross-Body Hammer Curl', category: 'Biceps' },
  { id: 'bi18', name: '21s (Barbell)', category: 'Biceps' },
  { id: 'bi19', name: 'High Cable Curl', category: 'Biceps' },
  { id: 'bi20', name: 'Drag Curl', category: 'Biceps' },
  { id: 'bi21', name: 'Bayesian Cable Curl', category: 'Biceps' },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  { id: 'tr01', name: 'Cable Pushdown (Rope)', category: 'Triceps' },
  { id: 'tr02', name: 'Cable Pushdown (Bar)', category: 'Triceps' },
  { id: 'tr03', name: 'Cable Pushdown (V-Bar)', category: 'Triceps' },
  { id: 'tr04', name: 'Barbell Skull Crusher', category: 'Triceps' },
  { id: 'tr05', name: 'Dumbbell Skull Crusher', category: 'Triceps' },
  { id: 'tr06', name: 'EZ-Bar Skull Crusher', category: 'Triceps' },
  { id: 'tr07', name: 'Barbell Overhead Tricep Extension', category: 'Triceps' },
  { id: 'tr08', name: 'Dumbbell Overhead Tricep Extension', category: 'Triceps' },
  { id: 'tr09', name: 'Cable Overhead Tricep Extension', category: 'Triceps' },
  { id: 'tr10', name: 'Close-Grip Bench Press', category: 'Triceps' },
  { id: 'tr11', name: 'Tricep Dips', category: 'Triceps' },
  { id: 'tr12', name: 'Dumbbell Kickback', category: 'Triceps' },
  { id: 'tr13', name: 'Cable Kickback', category: 'Triceps' },
  { id: 'tr14', name: 'Machine Tricep Extension', category: 'Triceps' },
  { id: 'tr15', name: 'Tate Press', category: 'Triceps' },
  { id: 'tr16', name: 'JM Press', category: 'Triceps' },
  { id: 'tr17', name: 'Rolling DB Extension', category: 'Triceps' },
  { id: 'tr18', name: 'Overhead Cable Tricep Extension (Single Arm)', category: 'Triceps' },
  { id: 'tr19', name: 'French Press (EZ-Bar)', category: 'Triceps' },

  // ── LEGS ───────────────────────────────────────────────────────────────────
  { id: 'l01', name: 'Barbell Back Squat', category: 'Legs' },
  { id: 'l02', name: 'Barbell Front Squat', category: 'Legs' },
  { id: 'l03', name: 'Goblet Squat', category: 'Legs' },
  { id: 'l04', name: 'Smith Machine Squat', category: 'Legs' },
  { id: 'l05', name: 'Hack Squat (Machine)', category: 'Legs' },
  { id: 'l06', name: 'Leg Press', category: 'Legs' },
  { id: 'l07', name: 'Dumbbell Lunge', category: 'Legs' },
  { id: 'l08', name: 'Barbell Lunge', category: 'Legs' },
  { id: 'l09', name: 'Walking Lunge', category: 'Legs' },
  { id: 'l10', name: 'Reverse Lunge', category: 'Legs' },
  { id: 'l11', name: 'Bulgarian Split Squat', category: 'Legs' },
  { id: 'l12', name: 'Step-Up (Dumbbell)', category: 'Legs' },
  { id: 'l13', name: 'Step-Up (Barbell)', category: 'Legs' },
  { id: 'l14', name: 'Box Squat', category: 'Legs' },
  { id: 'l15', name: 'Sissy Squat', category: 'Legs' },
  { id: 'l16', name: 'Sumo Squat (Dumbbell)', category: 'Legs' },
  { id: 'l17', name: 'Leg Extension (Machine)', category: 'Legs' },
  { id: 'l18', name: 'Lying Leg Curl (Machine)', category: 'Legs' },
  { id: 'l19', name: 'Seated Leg Curl (Machine)', category: 'Legs' },
  { id: 'l20', name: 'Nordic Hamstring Curl', category: 'Legs' },
  { id: 'l21', name: 'Glute Ham Raise', category: 'Legs' },
  { id: 'l22', name: 'Leg Adduction (Machine)', category: 'Legs' },
  { id: 'l23', name: 'Leg Abduction (Machine)', category: 'Legs' },
  { id: 'l24', name: 'Jump Squat', category: 'Legs' },
  { id: 'l25', name: 'Pause Squat', category: 'Legs' },
  { id: 'l26', name: 'Zercher Squat', category: 'Legs' },
  { id: 'l27', name: 'Pendulum Squat (Machine)', category: 'Legs' },
  { id: 'l28', name: 'Split Squat (Dumbbell)', category: 'Legs' },
  { id: 'l29', name: 'Landmine Squat', category: 'Legs' },

  // ── GLUTES ─────────────────────────────────────────────────────────────────
  { id: 'g01', name: 'Barbell Hip Thrust', category: 'Glutes' },
  { id: 'g02', name: 'Machine Hip Thrust', category: 'Glutes' },
  { id: 'g03', name: 'Dumbbell Hip Thrust', category: 'Glutes' },
  { id: 'g04', name: 'Glute Bridge', category: 'Glutes' },
  { id: 'g05', name: 'Single-Leg Glute Bridge', category: 'Glutes' },
  { id: 'g06', name: 'Cable Glute Kickback', category: 'Glutes' },
  { id: 'g07', name: 'Machine Glute Kickback', category: 'Glutes' },
  { id: 'g08', name: 'Donkey Kick', category: 'Glutes' },
  { id: 'g09', name: 'Clamshell', category: 'Glutes' },
  { id: 'g10', name: 'Lateral Band Walk', category: 'Glutes' },
  { id: 'g11', name: 'Romanian Deadlift (Single Leg)', category: 'Glutes' },
  { id: 'g12', name: 'Sumo Deadlift', category: 'Glutes' },
  { id: 'g13', name: 'Frog Pump', category: 'Glutes' },
  { id: 'g14', name: 'Cable Pull-Through', category: 'Glutes' },
  { id: 'g15', name: 'Smith Machine Hip Thrust', category: 'Glutes' },

  // ── CALVES ─────────────────────────────────────────────────────────────────
  { id: 'ca01', name: 'Standing Calf Raise (Machine)', category: 'Calves' },
  { id: 'ca02', name: 'Seated Calf Raise (Machine)', category: 'Calves' },
  { id: 'ca03', name: 'Barbell Calf Raise', category: 'Calves' },
  { id: 'ca04', name: 'Dumbbell Calf Raise', category: 'Calves' },
  { id: 'ca05', name: 'Leg Press Calf Raise', category: 'Calves' },
  { id: 'ca06', name: 'Donkey Calf Raise', category: 'Calves' },
  { id: 'ca07', name: 'Single-Leg Calf Raise', category: 'Calves' },

  // ── CORE ───────────────────────────────────────────────────────────────────
  { id: 'co01', name: 'Plank', category: 'Core' },
  { id: 'co02', name: 'Side Plank', category: 'Core' },
  { id: 'co03', name: 'Crunch', category: 'Core' },
  { id: 'co04', name: 'Bicycle Crunch', category: 'Core' },
  { id: 'co05', name: 'Lying Leg Raise', category: 'Core' },
  { id: 'co06', name: 'Hanging Leg Raise', category: 'Core' },
  { id: 'co07', name: 'Hanging Knee Raise', category: 'Core' },
  { id: 'co08', name: 'Toes to Bar', category: 'Core' },
  { id: 'co09', name: 'Ab Wheel Rollout', category: 'Core' },
  { id: 'co10', name: 'Cable Crunch', category: 'Core' },
  { id: 'co11', name: 'Decline Sit-Up', category: 'Core' },
  { id: 'co12', name: 'Russian Twist', category: 'Core' },
  { id: 'co13', name: 'Dead Bug', category: 'Core' },
  { id: 'co14', name: 'Bird Dog', category: 'Core' },
  { id: 'co15', name: 'Mountain Climber', category: 'Core' },
  { id: 'co16', name: 'V-Up', category: 'Core' },
  { id: 'co17', name: 'Dragon Flag', category: 'Core' },
  { id: 'co18', name: 'Hollow Body Hold', category: 'Core' },
  { id: 'co19', name: 'Pallof Press', category: 'Core' },
  { id: 'co20', name: 'L-Sit', category: 'Core' },
  { id: 'co21', name: 'Windmill', category: 'Core' },
  { id: 'co22', name: 'Reverse Crunch', category: 'Core' },
  { id: 'co23', name: 'Cable Woodchop', category: 'Core' },
  { id: 'co24', name: 'Copenhagen Plank', category: 'Core' },
  { id: 'co25', name: 'Incline Leg Raise', category: 'Core' },

  // ── FOREARMS ───────────────────────────────────────────────────────────────
  { id: 'fo01', name: 'Wrist Curl (Barbell)', category: 'Forearms' },
  { id: 'fo02', name: 'Wrist Curl (Dumbbell)', category: 'Forearms' },
  { id: 'fo03', name: 'Reverse Wrist Curl (Barbell)', category: 'Forearms' },
  { id: 'fo04', name: 'Reverse Wrist Curl (Dumbbell)', category: 'Forearms' },
  { id: 'fo05', name: 'Plate Pinch', category: 'Forearms' },
  { id: 'fo06', name: 'Farmer\'s Carry', category: 'Forearms' },
  { id: 'fo07', name: 'Wrist Roller', category: 'Forearms' },

  // ── FULL BODY ──────────────────────────────────────────────────────────────
  { id: 'f01', name: 'Clean and Press', category: 'Full Body' },
  { id: 'f02', name: 'Barbell Thruster', category: 'Full Body' },
  { id: 'f03', name: 'Dumbbell Thruster', category: 'Full Body' },
  { id: 'f04', name: 'Kettlebell Swing', category: 'Full Body' },
  { id: 'f05', name: 'Turkish Get-Up', category: 'Full Body' },
  { id: 'f06', name: 'Man Maker', category: 'Full Body' },
  { id: 'f07', name: 'Burpee', category: 'Full Body' },
  { id: 'f08', name: 'Power Clean', category: 'Full Body' },
  { id: 'f09', name: 'Power Snatch', category: 'Full Body' },
  { id: 'f10', name: 'Farmer\'s Carry', category: 'Full Body' },
  { id: 'f11', name: 'Sled Push', category: 'Full Body' },
  { id: 'f12', name: 'Sled Pull', category: 'Full Body' },
  { id: 'f13', name: 'Battle Ropes', category: 'Full Body' },
  { id: 'f14', name: 'Hang Clean', category: 'Full Body' },
  { id: 'f15', name: 'Push Press', category: 'Full Body' },
];

const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 't1',
    name: 'Push Day',
    exercises: [
      { id: 'c01', name: 'Barbell Bench Press', category: 'Chest', defaultSets: 4 },
      { id: 'c05', name: 'Dumbbell Incline Bench Press', category: 'Chest', defaultSets: 3 },
      { id: 's01', name: 'Barbell Overhead Press', category: 'Shoulders', defaultSets: 3 },
      { id: 's06', name: 'Dumbbell Lateral Raise', category: 'Shoulders', defaultSets: 3 },
      { id: 'tr01', name: 'Cable Pushdown (Rope)', category: 'Triceps', defaultSets: 3 },
    ],
  },
  {
    id: 't2',
    name: 'Pull Day',
    exercises: [
      { id: 'b01', name: 'Barbell Deadlift', category: 'Back', defaultSets: 3 },
      { id: 'b06', name: 'Pull-Up', category: 'Back', defaultSets: 3 },
      { id: 'b10', name: 'Lat Pulldown (Wide Grip)', category: 'Back', defaultSets: 3 },
      { id: 'b16', name: 'Cable Seated Row (Wide Grip)', category: 'Back', defaultSets: 3 },
      { id: 'bi01', name: 'Barbell Curl', category: 'Biceps', defaultSets: 3 },
    ],
  },
  {
    id: 't3',
    name: 'Leg Day',
    exercises: [
      { id: 'l01', name: 'Barbell Back Squat', category: 'Legs', defaultSets: 4 },
      { id: 'b02', name: 'Romanian Deadlift (Barbell)', category: 'Back', defaultSets: 3 },
      { id: 'l06', name: 'Leg Press', category: 'Legs', defaultSets: 3 },
      { id: 'l18', name: 'Lying Leg Curl (Machine)', category: 'Legs', defaultSets: 3 },
      { id: 'ca01', name: 'Standing Calf Raise (Machine)', category: 'Calves', defaultSets: 4 },
    ],
  },
];

export const getAllExercises = (): ExerciseTemplate[] => DEFAULT_EXERCISES;

// Templates
export async function getTemplates(): Promise<WorkoutTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TEMPLATES);
    if (!raw) {
      await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export async function saveTemplate(template: WorkoutTemplate): Promise<void> {
  const templates = await getTemplates();
  const idx = templates.findIndex(t => t.id === template.id);
  if (idx >= 0) templates[idx] = template;
  else templates.push(template);
  await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates.filter(t => t.id !== id)));
}

// Sessions
export async function getSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const sessions = await getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions.filter(s => s.id !== id)));
}

// Body measurements
export async function getMeasurements(): Promise<BodyMeasurement[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BODY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveMeasurement(measurement: BodyMeasurement): Promise<void> {
  const measurements = await getMeasurements();
  const idx = measurements.findIndex(m => m.id === measurement.id);
  if (idx >= 0) measurements[idx] = measurement;
  else measurements.unshift(measurement);
  await AsyncStorage.setItem(KEYS.BODY, JSON.stringify(measurements));
}

export async function deleteMeasurement(id: string): Promise<void> {
  const measurements = await getMeasurements();
  await AsyncStorage.setItem(KEYS.BODY, JSON.stringify(measurements.filter(m => m.id !== id)));
}

// ── YOUR WORKOUT PLAN ─────────────────────────────────────────────────────────

const MY_PLAN_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'plan-a',
    name: 'Sunday A — Back + Front Delts + Triceps',
    exercises: [
      { id: 'b10',  name: 'Lat Pulldown (Wide Grip)',              category: 'Back',      defaultSets: 3 },
      { id: 'b11',  name: 'Lat Pulldown (Close Grip)',             category: 'Back',      defaultSets: 3 },
      { id: 'b16',  name: 'Cable Seated Row (Wide Grip)',          category: 'Back',      defaultSets: 3 },
      { id: 'b15',  name: 'Dumbbell Single-Arm Row',               category: 'Back',      defaultSets: 3 },
      { id: 'b30',  name: 'Cable Pullover (Lat Focus)',            category: 'Back',      defaultSets: 3 },
      { id: 's11',  name: 'Cable Front Raise',                     category: 'Shoulders', defaultSets: 3 },
      { id: 's04',  name: 'Machine Shoulder Press',                category: 'Shoulders', defaultSets: 2 },
      { id: 's28',  name: 'Single-Arm Cable Front Raise',         category: 'Shoulders', defaultSets: 2 },
      { id: 'tr01', name: 'Cable Pushdown (Rope)',                 category: 'Triceps',   defaultSets: 2 },
      { id: 'tr08', name: 'Dumbbell Overhead Tricep Extension',   category: 'Triceps',   defaultSets: 2 },
      { id: 'b26',  name: 'Hyperextension (45°)',                  category: 'Back',      defaultSets: 3 },
    ],
  },
  {
    id: 'plan-b',
    name: 'Tuesday B — Arms + Shoulders + Abs',
    exercises: [
      { id: 'tr01', name: 'Cable Pushdown (Rope)',                 category: 'Triceps',   defaultSets: 3 },
      { id: 'bi02', name: 'Dumbbell Curl',                         category: 'Biceps',    defaultSets: 3 },
      { id: 's02',  name: 'Dumbbell Overhead Press',              category: 'Shoulders', defaultSets: 2 },
      { id: 'tr08', name: 'Dumbbell Overhead Tricep Extension',   category: 'Triceps',   defaultSets: 2 },
      { id: 'bi16', name: 'EZ-Bar Curl',                          category: 'Biceps',    defaultSets: 2 },
      { id: 's06',  name: 'Dumbbell Lateral Raise',               category: 'Shoulders', defaultSets: 2 },
      { id: 'tr19', name: 'French Press (EZ-Bar)',                category: 'Triceps',   defaultSets: 2 },
      { id: 'bi03', name: 'Hammer Curl',                          category: 'Biceps',    defaultSets: 2 },
      { id: 's14',  name: 'Machine Rear Delt (Pec Deck)',         category: 'Shoulders', defaultSets: 2 },
      { id: 'co25', name: 'Incline Leg Raise',                    category: 'Core',      defaultSets: 4 },
    ],
  },
  {
    id: 'plan-c',
    name: 'Thursday C — Chest + Rear Delts + Biceps',
    exercises: [
      { id: 'c05',  name: 'Dumbbell Incline Bench Press',         category: 'Chest',     defaultSets: 3 },
      { id: 'c10',  name: 'Machine Chest Press',                  category: 'Chest',     defaultSets: 3 },
      { id: 'c02',  name: 'Dumbbell Bench Press',                 category: 'Chest',     defaultSets: 3 },
      { id: 'c04',  name: 'Barbell Incline Bench Press',          category: 'Chest',     defaultSets: 3 },
      { id: 'c17',  name: 'Pec Deck Machine',                     category: 'Chest',     defaultSets: 3 },
      { id: 's14',  name: 'Machine Rear Delt (Pec Deck)',         category: 'Shoulders', defaultSets: 2 },
      { id: 's21',  name: 'Cable Face Pull',                      category: 'Shoulders', defaultSets: 2 },
      { id: 's12',  name: 'Dumbbell Rear Delt Fly',              category: 'Shoulders', defaultSets: 2 },
      { id: 'bi02', name: 'Dumbbell Curl',                        category: 'Biceps',    defaultSets: 2 },
      { id: 'bi03', name: 'Hammer Curl',                          category: 'Biceps',    defaultSets: 2 },
    ],
  },
  {
    id: 'plan-d',
    name: 'Saturday D — Legs',
    exercises: [
      { id: 'l01',  name: 'Barbell Back Squat',                   category: 'Legs',   defaultSets: 3 },
      { id: 'l07',  name: 'Dumbbell Lunge',                       category: 'Legs',   defaultSets: 3 },
      { id: 'l06',  name: 'Leg Press',                            category: 'Legs',   defaultSets: 3 },
      { id: 'l22',  name: 'Leg Adduction (Machine)',              category: 'Legs',   defaultSets: 3 },
      { id: 'l23',  name: 'Leg Abduction (Machine)',              category: 'Legs',   defaultSets: 3 },
      { id: 'l17',  name: 'Leg Extension (Machine)',              category: 'Legs',   defaultSets: 3 },
      { id: 'l19',  name: 'Seated Leg Curl (Machine)',            category: 'Legs',   defaultSets: 3 },
      { id: 'ca01', name: 'Standing Calf Raise (Machine)',        category: 'Calves', defaultSets: 3 },
    ],
  },
];

export async function seedWorkoutPlan(): Promise<void> {
  try {
    const already = await AsyncStorage.getItem('plan_seeded_v1');
    if (already) return;
    const templates = await getTemplates();
    const existingIds = new Set(templates.map(t => t.id));
    const toAdd = MY_PLAN_TEMPLATES.filter(t => !existingIds.has(t.id));
    if (toAdd.length > 0) {
      await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify([...templates, ...toAdd]));
    }
    await AsyncStorage.setItem('plan_seeded_v1', 'true');
  } catch {
    // silently ignore
  }
}
