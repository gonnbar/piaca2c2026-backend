import mongoose from "mongoose";

export interface IMeasurement extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  weight?: number;
  height?: number;
  // Pliegues (mm)
  bicipital?: number;
  tricipital?: number;
  subescapular?: number;
  suprailiaco?: number;
  crural?: number;
  abdominal?: number;
  pectoral?: number;
  axilar?: number;
  peroneoGemelar?: number;
  // Calculados
  imc?: number;
  bodyFatPercentage?: number;
  musclePercentage?: number;
}

const measurementSchema = new mongoose.Schema<IMeasurement>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    weight: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    bicipital: Number,
    tricipital: Number,
    subescapular: Number,
    suprailiaco: Number,
    crural: Number,
    abdominal: Number,
    pectoral: Number,
    axilar: Number,
    peroneoGemelar: Number,
    imc: Number,
    bodyFatPercentage: Number,
    musclePercentage: Number,
  },
  { timestamps: true },
);

measurementSchema.index({ patient: 1, date: -1 });

export const Measurement = mongoose.model<IMeasurement>("Measurement", measurementSchema);
