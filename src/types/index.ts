export interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
}

export interface TemplateExercise extends ExerciseTemplate {
  defaultSets: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}

export interface SetEntry {
  weight: string;
  reps: string;
  completed: boolean;
}

export interface ExerciseSession {
  exercise: ExerciseTemplate;
  sets: SetEntry[];
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  templateName: string;
  date: string; // ISO string
  duration: number; // minutes
  exercises: ExerciseSession[];
}

export interface BodyMeasurement {
  id: string;
  date: string; // ISO string
  weight: string;
  leftArm: string;
  rightArm: string;
  waistRelaxed: string;
  waistFlexed: string;
  rightThigh: string;
  leftThigh: string;
  notes: string;
}
