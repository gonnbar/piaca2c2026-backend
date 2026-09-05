import mongoose from "mongoose";

export interface IWorkout extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
  perceivedIntensity?: number; // 1-10
}

const workoutSchema = new mongoose.Schema<IWorkout>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    exercise: { type: String, required: true, trim: true },
    sets: { type: Number, required: true, min: 1 },
    reps: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0 },
    notes: String,
    perceivedIntensity: { type: Number, min: 1, max: 10 },
  },
  { timestamps: true },
);

workoutSchema.index({ patient: 1, date: -1 });
workoutSchema.index({ patient: 1, exercise: 1 });

export const Workout = mongoose.model<IWorkout>("Workout", workoutSchema);
