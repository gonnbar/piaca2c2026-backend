import mongoose from "mongoose";
import { Patient } from "../models/Patient.js";
import { findAccessiblePatient } from "./patientService.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("No encontrado"), { statusCode: 404 });
const badRequest = (msg: string) => Object.assign(new Error(msg), { statusCode: 400 });

/**
 * Resuelve el patient ObjectId al que el usuario tiene acceso.
 * - Paciente: siempre su propio Patient (ignora cualquier parámetro del cliente).
 * - Nutricionista: exige un patientId y valida que le pertenezca (Regla 7/18).
 */
export async function resolvePatientId(
  user: AuthUser,
  requestedId?: unknown,
): Promise<string> {
  if (user.role === "patient") {
    const own = await Patient.findOne({ user: user.id, isActive: true }).select("_id");
    if (!own) throw notFound();
    return String(own._id);
  }
  const id = typeof requestedId === "string" ? requestedId : "";
  if (!mongoose.isValidObjectId(id)) throw badRequest("patient requerido o inválido");
  await findAccessiblePatient(id, user); // 404 si no le pertenece
  return id;
}

/** Valida que un documento existente pertenezca al ámbito del usuario. */
export async function assertDocAccess(
  user: AuthUser,
  docPatientId: unknown,
): Promise<string> {
  const docPatient = String(docPatientId);
  if (user.role === "patient") {
    const own = await Patient.findOne({ user: user.id, isActive: true }).select("_id");
    if (!own || String(own._id) !== docPatient) throw notFound();
    return docPatient;
  }
  await findAccessiblePatient(docPatient, user);
  return docPatient;
}
