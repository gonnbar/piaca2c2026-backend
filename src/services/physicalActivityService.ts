import mongoose from "mongoose";
import { PhysicalActivity } from "../models/PhysicalActivity.js";
import { assertEditWindow } from "../utils/editWindow.js";
import { resolvePatientId, assertDocAccess } from "./patientScope.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("No encontrado"), { statusCode: 404 });

type ActivityIntensity = "baja" | "media" | "alta";

// RF-08 — HU35: registrar actividad (tipo, duración, intensidad, observaciones)
export async function createActivity(user: AuthUser, body: Record<string, unknown>) {
  const patientId = await resolvePatientId(user, body.patient);
  const doc = await PhysicalActivity.create({
    patient: patientId,
    createdBy: user.id,
    date: body.date ? new Date(body.date as string | Date) : new Date(),
    type: body.type as string,
    duration: body.duration as number,
    intensity: body.intensity as ActivityIntensity | undefined,
    notes: body.notes as string | undefined,
  });
  return doc;
}

// HU36 (paciente) / HU37 (nutricionista): listar con scope por rol
export async function listActivities(user: AuthUser, queryPatient?: unknown) {
  const patientId = await resolvePatientId(user, queryPatient);
  return PhysicalActivity.find({ patient: patientId }).sort({ date: -1 });
}

export async function getActivityById(user: AuthUser, id: string) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const doc = await PhysicalActivity.findById(id);
  if (!doc) throw notFound();
  await assertDocAccess(user, doc.patient);
  return doc;
}

// HU38 + RF-12: nutricionista sin restricción, paciente solo dentro de 10 min
export async function updateActivity(
  user: AuthUser,
  id: string,
  body: Record<string, unknown>,
) {
  const doc = await getActivityById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  if (body.type !== undefined) doc.type = body.type as string;
  if (body.date !== undefined) doc.date = new Date(body.date as string | Date);
  if (body.duration !== undefined) doc.duration = body.duration as number;
  if (body.intensity !== undefined) doc.intensity = body.intensity as ActivityIntensity;
  if (body.notes !== undefined) doc.notes = body.notes as string;
  await doc.save();
  return doc;
}

export async function deleteActivity(user: AuthUser, id: string) {
  const doc = await getActivityById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  await doc.deleteOne();
}
