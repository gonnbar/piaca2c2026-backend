import mongoose from "mongoose";

export interface IPatient extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  user: mongoose.Types.ObjectId;
  nutritionist: mongoose.Types.ObjectId;
  fullName: string;
  birthDate?: Date;
  sex?: "M" | "F" | "X";
  phone?: string;
  height?: number;
  weight?: number;
  diseases?: string;
  allergies?: string;
  foodPreferences?: string;
  goals?: string;
  isActive: boolean;
}

const patientSchema = new mongoose.Schema<IPatient>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true, trim: true },
    birthDate: { type: Date },
    sex: { type: String, enum: ["M", "F", "X"] },
    phone: { type: String, trim: true },
    height: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    diseases: { type: String },
    allergies: { type: String },
    foodPreferences: { type: String },
    goals: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

patientSchema.index({ fullName: 1 });
patientSchema.index({ nutritionist: 1 });

export const Patient = mongoose.model<IPatient>("Patient", patientSchema);
