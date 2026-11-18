import mongoose from "mongoose";
import { Food } from "../models/Food.js";
import { calculateFoodCalories } from "../utils/calculations.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("Alimento no encontrado"), { statusCode: 404 });
const conflict = (msg: string) => Object.assign(new Error(msg), { statusCode: 409 });

// `calories` no forma parte de la entrada: se calcula desde los macros.
type FoodInput = {
  name: string;
  category: string;
  protein: number;
  carbs: number;
  fat: number;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertNameAvailable(name: string, excludeId?: string) {
  const filter: Record<string, unknown> = { name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" } };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await Food.findOne(filter).select("_id isActive");
  if (existing) {
    throw conflict(
      existing.isActive === false
        ? "Ya existe un alimento con ese nombre (eliminado). Reactivalo o usá otro nombre."
        : "Ya existe un alimento con ese nombre",
    );
  }
}

// El borrado lógico deja el documento con isActive=false; los documentos
// históricos (seed previo) no tienen el campo, por eso se usa $ne:false.
function activeFilter(includeInactive: boolean): Record<string, unknown> {
  return includeInactive ? {} : { isActive: { $ne: false } };
}

export async function listFoods(
  user: AuthUser,
  query: { category?: unknown; search?: unknown; includeInactive?: unknown },
) {
  const includeInactive = user.role === "nutritionist" && query.includeInactive === "true";
  const filter: Record<string, unknown> = { ...activeFilter(includeInactive) };
  if (typeof query.category === "string" && query.category) filter.category = query.category;
  if (typeof query.search === "string" && query.search.trim()) {
    filter.name = { $regex: escapeRegExp(query.search.trim()), $options: "i" };
  }
  return Food.find(filter).sort({ name: 1 }).limit(200);
}

export async function getFood(id: string) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const food = await Food.findById(id);
  if (!food) throw notFound();
  return food;
}

export async function createFood(input: FoodInput) {
  await assertNameAvailable(input.name);
  const calories = calculateFoodCalories(input.protein, input.carbs, input.fat);
  return Food.create({ ...input, calories, isActive: true });
}

export async function updateFood(id: string, input: FoodInput) {
  const food = await getFood(id);
  await assertNameAvailable(input.name, id);
  food.name = input.name;
  food.category = input.category;
  food.protein = input.protein;
  food.carbs = input.carbs;
  food.fat = input.fat;
  food.calories = calculateFoodCalories(input.protein, input.carbs, input.fat);
  await food.save();
  return food;
}

// Eliminación lógica: nunca se borra el documento para conservar el historial
// de comidas que lo referencian.
export async function softDeleteFood(id: string) {
  const food = await getFood(id);
  if (food.isActive !== false) {
    food.isActive = false;
    await food.save();
  }
  return food;
}

export async function restoreFood(id: string) {
  const food = await getFood(id);
  if (food.isActive === false) {
    food.isActive = true;
    await food.save();
  }
  return food;
}
