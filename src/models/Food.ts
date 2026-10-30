import mongoose from "mongoose";
import { FOOD_CATEGORIES } from "../utils/foodCategories.js";

export interface IFood extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  category: string;
  calories: number; // por 100g
  protein: number;
  carbs: number;
  fat: number;
  // Borrado lógico: los alimentos nunca se eliminan físicamente.
  isActive: boolean;
}

const foodSchema = new mongoose.Schema<IFood>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: [...FOOD_CATEGORIES],
      required: true,
    },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

foodSchema.index({ category: 1 });
foodSchema.index({ name: "text" });

export const Food = mongoose.model<IFood>("Food", foodSchema);
