import mongoose from "mongoose";

export interface IFood extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  category: string;
  calories: number; // por 100g
  protein: number;
  carbs: number;
  fat: number;
}

const foodSchema = new mongoose.Schema<IFood>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["carnes", "huevos", "leche", "quesos", "yogur", "verduras", "cereales", "frutas", "semillas", "miel", "azucar", "aceites", "grasas", "otros"],
      required: true,
    },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

foodSchema.index({ category: 1 });
foodSchema.index({ name: "text" });

export const Food = mongoose.model<IFood>("Food", foodSchema);
