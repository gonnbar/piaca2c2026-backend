import { calculateIMC } from "../utils/calculations.js";

export const ANTHROPOMETRY_METHOD = "Durnin-Womersley (1974) + Siri (1961)";
export const ANTHROPOMETRY_VERSION = "1.0.0";
export const MIN_AGE = 17;
export const MAX_AGE = 72;

export type Sex = "M" | "F";

type CoefficientGroup = {
  maxAge: number;
  C: number;
  M: number;
};

const COEFFICIENTS: Record<Sex, CoefficientGroup[]> = {
  M: [
    { maxAge: 19, C: 1.162, M: 0.063 },
    { maxAge: 29, C: 1.1631, M: 0.0632 },
    { maxAge: 39, C: 1.1422, M: 0.0544 },
    { maxAge: 49, C: 1.162, M: 0.07 },
    { maxAge: MAX_AGE, C: 1.1715, M: 0.0779 },
  ],
  F: [
    { maxAge: 19, C: 1.1549, M: 0.0678 },
    { maxAge: 29, C: 1.1599, M: 0.0717 },
    { maxAge: 39, C: 1.1423, M: 0.0632 },
    { maxAge: 49, C: 1.1333, M: 0.0612 },
    { maxAge: MAX_AGE, C: 1.1339, M: 0.0645 },
  ],
};

const REQUIRED_FOLDS = [
  { key: "bicipital", label: "bicipital" },
  { key: "tricipital", label: "tricipital" },
  { key: "subescapular", label: "subescapular" },
  { key: "suprailiaco", label: "suprailiaco" },
] as const;

export type Indicator =
  | { calculable: true; value: number; unit: string }
  | { calculable: false; reason: string };

export type SkinfoldInput = Partial<Record<(typeof REQUIRED_FOLDS)[number]["key"], unknown>>;

export type AnthropometryInput = {
  sex?: unknown;
  birthDate?: Date | string | null;
  measurementDate?: Date | string | null;
  weightKg?: unknown;
  heightCm?: unknown;
  foldsMm?: SkinfoldInput;
};

export type AnthropometryResult = {
  method: { name: string; version: string };
  imc: Indicator;
  bodyFatPercentage: Indicator;
  fatMass: Indicator;
  leanMass: Indicator;
  inputs: {
    age: number | null;
    sex: Sex | null;
    skinfoldSumMm: number | null;
    bodyDensity: number | null;
  };
};

const notCalculable = (reason: string): Indicator => ({ calculable: false, reason });

const ok = (value: number, unit: string): Indicator => ({ calculable: true, value, unit });

const isPositiveFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const toValidDate = (value: Date | string | null | undefined): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && value.trim() !== "") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const round2 = (value: number) => Number(value.toFixed(2));

/** Edad cumplida en UTC a la fecha de la medición. */
export function calculateAge(birthDate: Date | string | null | undefined, atDate: Date | string | null | undefined): number | null {
  const birth = toValidDate(birthDate);
  const at = toValidDate(atDate);
  if (!birth || !at || birth.getTime() > at.getTime()) return null;

  let age = at.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = at.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

const resolveSex = (sex: unknown): Sex | null => (sex === "M" || sex === "F" ? sex : null);

const resolveCoefficients = (sex: Sex, age: number): CoefficientGroup | null => {
  if (age < MIN_AGE || age > MAX_AGE) return null;
  return COEFFICIENTS[sex].find((group) => age <= group.maxAge) ?? null;
};

/**
 * Durnin-Womersley (1974) + Siri (1961).
 * Solo usa bicipital, tricipital, subescapular y suprailiaco (mm).
 * No hay redondeos intermedios: el redondeo se aplica a la salida.
 */
export function calculateAnthropometry(input: AnthropometryInput): AnthropometryResult {
  const method = { name: ANTHROPOMETRY_METHOD, version: ANTHROPOMETRY_VERSION };
  const measurementDate = toValidDate(input.measurementDate);
  const age = calculateAge(input.birthDate, measurementDate);
  const sex = resolveSex(input.sex);

  const imc = (() => {
    if (!isPositiveFinite(input.weightKg) || !isPositiveFinite(input.heightCm)) {
      return notCalculable("Peso y altura deben ser numéricos y mayores que cero");
    }
    const value = calculateIMC(input.weightKg, input.heightCm);
    return Number.isFinite(value) && value > 0
      ? ok(value, "kg/m²")
      : notCalculable("No se pudo calcular el IMC");
  })();

  let skinfoldSumMm: number | null = null;
  let bodyDensity: number | null = null;
  let bodyFatFull: number | null = null;

  const bodyFatPercentage = (() => {
    if (!measurementDate) return notCalculable("Fecha de medición inválida");
    if (age === null) return notCalculable("Falta la fecha de nacimiento del paciente");
    if (age < MIN_AGE || age > MAX_AGE) {
      return notCalculable(`Edad fuera del rango admitido (${MIN_AGE}–${MAX_AGE} años)`);
    }
    if (!sex) return notCalculable("Sexo no compatible con la ecuación (se requiere M o F)");

    const coefficients = resolveCoefficients(sex, age);
    if (!coefficients) return notCalculable("No hay coeficientes para la edad indicada");

    const missing = REQUIRED_FOLDS.filter(({ key }) => !isPositiveFinite(input.foldsMm?.[key])).map(
      ({ label }) => label,
    );
    if (missing.length > 0) {
      return notCalculable(`Pliegues inválidos o faltantes: ${missing.join(", ")}`);
    }

    const sum = REQUIRED_FOLDS.reduce((acc, { key }) => acc + (input.foldsMm?.[key] as number), 0);
    if (!isPositiveFinite(sum)) return notCalculable("La suma de pliegues debe ser mayor que cero");

    const density = coefficients.C - coefficients.M * Math.log10(sum);
    if (!Number.isFinite(density) || density <= 0) {
      return notCalculable("No se pudo calcular la densidad corporal");
    }

    const percentage = 495 / density - 450;
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return notCalculable("Porcentaje de grasa fuera del rango válido (0–100)");
    }

    skinfoldSumMm = sum;
    bodyDensity = density;
    bodyFatFull = percentage;
    return ok(round2(percentage), "%");
  })();

  const weight = isPositiveFinite(input.weightKg) ? input.weightKg : null;
  const fatMassFull =
    weight !== null && bodyFatFull !== null ? (weight * bodyFatFull) / 100 : null;
  const leanMassFull = fatMassFull !== null && weight !== null ? weight - fatMassFull : null;

  const fatMass = (() => {
    if (weight === null || fatMassFull === null) {
      return notCalculable("Requiere peso válido y porcentaje de grasa calculable");
    }
    if (!Number.isFinite(fatMassFull) || fatMassFull < 0) {
      return notCalculable("No se pudo calcular la masa grasa");
    }
    return ok(round2(fatMassFull), "kg");
  })();

  const leanMass = (() => {
    if (leanMassFull === null) {
      return notCalculable("Requiere peso válido y porcentaje de grasa calculable");
    }
    if (!Number.isFinite(leanMassFull) || leanMassFull < 0) {
      return notCalculable("No se pudo calcular la masa libre de grasa");
    }
    return ok(round2(leanMassFull), "kg");
  })();

  return {
    method,
    imc,
    bodyFatPercentage,
    fatMass,
    leanMass,
    inputs: { age, sex, skinfoldSumMm, bodyDensity },
  };
}
