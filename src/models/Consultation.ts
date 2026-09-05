import mongoose from "mongoose";

export interface IConsultation extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  nutritionist: mongoose.Types.ObjectId;
  date: Date;
  observations: string;
  weight?: number;
  notes?: string;
}

const consultationSchema = new mongoose.Schema<IConsultation>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    observations: { type: String, required: true },
    weight: Number,
    notes: String,
  },
  { timestamps: true },
);

consultationSchema.index({ patient: 1, date: -1 });

export const Consultation = mongoose.model<IConsultation>("Consultation", consultationSchema);
