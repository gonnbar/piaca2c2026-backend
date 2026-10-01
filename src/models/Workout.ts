import mongoose from "mongoose";

export interface IExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number; // carga en kg
  notes?: string;
}

export interface IWorkout extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  notes?: string; // observaciones generales del entrenamiento
  perceivedIntensity?: number; // 1-10
  exercises: IExercise[];
}

const exerciseSchema = new mongoose.Schema<IExercise>(
  {
    // Regla 16: el paciente puede crear libremente los ejercicios (nombre libre)
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sets: { type: Number, required: true, min: 1, max: 100 },
    reps: { type: Number, required: true, min: 1, max: 1000 },
    weight: { type: Number, required: true, min: 0, max: 1000 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const workoutSchema = new mongoose.Schema<IWorkout>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 1000 },
    perceivedIntensity: { type: Number, min: 1, max: 10 },
    // Regla 15: cada entrenamiento puede incluir uno o más ejercicios
    exercises: {
      type: [exerciseSchema],
      required: true,
      validate: {
        validator: (v: IExercise[]) => Array.isArray(v) && v.length >= 1,
        message: "El entrenamiento debe incluir al menos un ejercicio",
      },
    },
  },
  { timestamps: true },
);

workoutSchema.index({ patient: 1, date: -1 });
workoutSchema.index({ patient: 1, "exercises.name": 1 });

export const Workout = mongoose.model<IWorkout>("Workout", workoutSchema);
