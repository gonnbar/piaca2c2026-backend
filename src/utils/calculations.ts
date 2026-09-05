/**
 * Fórmulas separadas de controladores y UI.
 * AGENTS.md: "Las fórmulas deben estar separadas de los controladores y de la UI."
 */

export function calculateIMC(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) throw new Error("Altura debe ser mayor a 0");
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
}

/** Placeholder hasta definir protocolo (Faulkner, Yuhasz, etc.) */
export function calculateBodyFatPercentage(
  _measurements: Record<string, number>,
): number | null {
  return null;
}

export function calculateMusclePercentage(
  _measurements: Record<string, number>,
): number | null {
  return null;
}

export function calculateMealTotals(
  foods: { calories: number; protein: number; carbs: number; fat: number; grams: number }[],
) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories * f.grams) / 100,
      protein: acc.protein + (f.protein * f.grams) / 100,
      carbs: acc.carbs + (f.carbs * f.grams) / 100,
      fat: acc.fat + (f.fat * f.grams) / 100,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
