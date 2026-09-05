import mongoose from "mongoose";

export interface IPhoto extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  view: "frente" | "perfil" | "espalda";
  url: string;
  filename: string;
}

const photoSchema = new mongoose.Schema<IPhoto>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    view: { type: String, enum: ["frente", "perfil", "espalda"], required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { timestamps: true },
);

photoSchema.index({ patient: 1, date: -1 });

export const Photo = mongoose.model<IPhoto>("Photo", photoSchema);
