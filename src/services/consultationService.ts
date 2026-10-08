import mongoose from "mongoose";
import { Consultation, type IConsultation } from "../models/Consultation.js";
import { Measurement } from "../models/Measurement.js";
import { Patient } from "../models/Patient.js";
import { calculateIMC } from "../utils/calculations.js";
import type { AuthUser } from "../middlewares/auth.js";

const httpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const CONSULTATION_EDITABLE = ["date", "observations", "privateNotes"];
const MEASUREMENT_FIELDS = [
  "weight", "height", "bicipital", "tricipital", "subescapular", "suprailiaco",
  "crural", "abdominal", "pectoral", "axilar", "peroneoGemelar",
];

const pick = (obj: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const patientScope = (user: AuthUser) =>
  user.role === "nutritionist" ? { nutritionist: user.id } : { user: user.id };

// 404 si el paciente no existe, está dado de baja o no le corresponde al usuario
async function assertPatientAccess(
  patientId: string | mongoose.Types.ObjectId,
  user: AuthUser,
  message = "Paciente no encontrado",
) {
  if (!mongoose.isValidObjectId(patientId)) throw httpError(message, 404);
  const ok = await Patient.exists({ _id: patientId, isActive: true, ...patientScope(user) });
  if (!ok) throw httpError(message, 404);
}

async function findAccessibleConsultation(id: string, user: AuthUser) {
  const message = "Consulta no encontrada";
  if (!mongoose.isValidObjectId(id)) throw httpError(message, 404);
  const query = Consultation.findById(id);
  if (user.role === "nutritionist") query.select("+privateNotes");
  const consultation = await query;
  if (!consultation) throw httpError(message, 404);
  await assertPatientAccess(consultation.patient, user, message);
  return consultation;
}

async function attachMeasurements(consultations: IConsultation[]) {
  const measurements = await Measurement.find({ consultation: { $in: consultations.map((c) => c._id) } });
  const byConsultation = new Map(measurements.map((m) => [String(m.consultation), m]));
  return consultations.map((c) => ({ ...c.toJSON(), measurement: byConsultation.get(String(c._id)) ?? null }));
}

// Crea o actualiza la medición ligada a la consulta (la fuente única del peso clínico)
async function saveMeasurement(consultation: IConsultation, nutritionistId: string, input: Record<string, unknown>) {
  const fields = pick(input, MEASUREMENT_FIELDS);
  if (Object.keys(fields).length === 0) return;

  const measurement =
    (await Measurement.findOne({ consultation: consultation._id })) ??
    new Measurement({ patient: consultation.patient, createdBy: nutritionistId, consultation: consultation._id });

  measurement.set({ ...fields, date: consultation.date });
  if (measurement.weight && measurement.height) {
    measurement.imc = calculateIMC(measurement.weight, measurement.height);
  }
  await measurement.save();
}

type CreateConsultationInput = {
  patientId: string;
  date?: Date;
  observations: string;
  privateNotes?: string;
  measurement?: Record<string, unknown>;
};

export async function createConsultation(user: AuthUser, data: CreateConsultationInput) {
  await assertPatientAccess(data.patientId, user);

  const consultation = await Consultation.create({
    patient: data.patientId,
    nutritionist: user.id,
    date: data.date,
    observations: data.observations,
    privateNotes: data.privateNotes,
  });

  try {
    await saveMeasurement(consultation, user.id, data.measurement ?? {});
  } catch (err) {
    await Consultation.findByIdAndDelete(consultation._id); // evita consultas sin su medición
    throw err;
  }
  return getConsultation(consultation.id, user);
}

export async function listConsultations(user: AuthUser, patientId?: string) {
  let targetPatient: string | mongoose.Types.ObjectId;

  if (user.role === "patient") {
    const own = await Patient.findOne({ user: user.id, isActive: true }).select("_id");
    if (!own) throw httpError("Paciente no encontrado", 404);
    targetPatient = own._id;
  } else {
    if (!patientId) throw httpError("Falta el parámetro patient", 400);
    await assertPatientAccess(patientId, user);
    targetPatient = patientId;
  }

  const query = Consultation.find({ patient: targetPatient }).sort({ date: -1 });
  if (user.role === "nutritionist") query.select("+privateNotes");
  return attachMeasurements(await query);
}

export async function getConsultation(id: string, user: AuthUser) {
  const consultation = await findAccessibleConsultation(id, user);
  return (await attachMeasurements([consultation]))[0];
}

export async function updateConsultation(id: string, user: AuthUser, body: Record<string, unknown>) {
  const consultation = await findAccessibleConsultation(id, user);
  consultation.set(pick(body, CONSULTATION_EDITABLE));
  await consultation.save();

  if (body.measurement && typeof body.measurement === "object") {
    await saveMeasurement(consultation, user.id, body.measurement as Record<string, unknown>);
  } else if ("date" in body) {
    await Measurement.updateOne({ consultation: consultation._id }, { date: consultation.date });
  }
  return getConsultation(id, user);
}

export async function deleteConsultation(id: string, user: AuthUser) {
  const consultation = await findAccessibleConsultation(id, user);
  await Measurement.deleteMany({ consultation: consultation._id });
  await consultation.deleteOne();
}