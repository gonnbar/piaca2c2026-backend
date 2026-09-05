import mongoose from "mongoose";

export interface IPhysicalActivity extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  type: string;
  duration: number; // minutos
  intensity?: "baja" | "media" | "alta";
  notes?: string;
}

const physicalActivitySchema = new mongoose.Schema<IPhysicalActivity>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    intensity: { type: String, enum: ["baja", "media", "alta"] },
    notes: String,
  },
  { timestamps: true },
);

physicalActivitySchema.index({ patient: 1, date: -1 });

export const PhysicalActivity = mongoose.model<IPhysicalActivity>(
  "PhysicalActivity",
  physicalActivitySchema,
);
