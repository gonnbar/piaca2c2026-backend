import mongoose from "mongoose";

export interface IMealItem {
  food: mongoose.Types.ObjectId;
  grams: number;
}

export interface IMeal extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  patient: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  items: IMealItem[];
  // Totales calculados automáticamente
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const mealSchema = new mongoose.Schema<IMeal>(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    items: [
      {
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        grams: { type: Number, required: true, min: 1 },
      },
    ],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
  },
  { timestamps: true },
);

mealSchema.index({ patient: 1, date: -1 });

export const Meal = mongoose.model<IMeal>("Meal", mealSchema);
