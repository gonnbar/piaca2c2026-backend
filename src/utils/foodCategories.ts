// Categorías de la base de alimentos (AGENTS.md: Base de alimentos).
// Fuente única para el enum del modelo y la validación de entrada.
export const FOOD_CATEGORIES = [
  "carnes",
  "huevos",
  "leche",
  "quesos",
  "yogur",
  "verduras",
  "cereales",
  "frutas",
  "semillas",
  "miel",
  "azucar",
  "aceites",
  "grasas",
  "otros",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
