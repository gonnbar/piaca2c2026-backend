import { Patient } from "../models/Patient.js";
import {
  ANTHROPOMETRY_METHOD,
  ANTHROPOMETRY_VERSION,
  calculateAnthropometry,
  type AnthropometryResult,
} from "./anthropometryService.js";

export type MeasurementInput = {
  weight?: unknown;
  height?: unknown;
  bicipital?: unknown;
  tricipital?: unknown;
  subescapular?: unknown;
  suprailiaco?: unknown;
  date?: unknown;
};

export type MeasurementDerivedFields = {
  imc: number | null;
  bodyFatPercentage: number | null;
  fatMass: number | null;
  leanMass: number | null;
  bodyFatMethod: string | null;
  bodyFatMethodVersion: string | null;
};

const notFound = () => Object.assign(new Error("Paciente no encontrado"), { statusCode: 404 });

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && value.trim() !== "") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

/**
 * Obtiene sexo/fecha de nacimiento del paciente y calcula los campos derivados
 * de la medición. No persiste: el llamador decide qué guardar.
 */
export async function computeMeasurementDerived(
  patientId: string,
  input: MeasurementInput,
  date?: Date,
): Promise<{ anthropometry: AnthropometryResult; fields: MeasurementDerivedFields }> {
  const patient = await Patient.findById(patientId).select("sex birthDate");
  if (!patient) throw notFound();

  const measurementDate = toDateOrNull(date) ?? toDateOrNull(input.date) ?? new Date();

  const anthropometry = calculateAnthropometry({
    sex: patient.sex,
    birthDate: patient.birthDate,
    measurementDate,
    weightKg: toNumberOrNull(input.weight),
    heightCm: toNumberOrNull(input.height),
    foldsMm: {
      bicipital: toNumberOrNull(input.bicipital),
      tricipital: toNumberOrNull(input.tricipital),
      subescapular: toNumberOrNull(input.subescapular),
      suprailiaco: toNumberOrNull(input.suprailiaco),
    },
  });

  const bodyFat = anthropometry.bodyFatPercentage;

  return {
    anthropometry,
    fields: {
      imc: anthropometry.imc.calculable ? anthropometry.imc.value : null,
      bodyFatPercentage: bodyFat.calculable ? bodyFat.value : null,
      fatMass: anthropometry.fatMass.calculable ? anthropometry.fatMass.value : null,
      leanMass: anthropometry.leanMass.calculable ? anthropometry.leanMass.value : null,
      bodyFatMethod: bodyFat.calculable ? ANTHROPOMETRY_METHOD : null,
      bodyFatMethodVersion: bodyFat.calculable ? ANTHROPOMETRY_VERSION : null,
    },
  };
}
