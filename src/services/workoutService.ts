import mongoose from "mongoose";
import { Workout, type IExercise } from "../models/Workout.js";
import { assertEditWindow } from "../utils/editWindow.js";
import { resolvePatientId, assertDocAccess } from "./patientScope.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("No encontrado"), { statusCode: 404 });

// RF-09 — HU39: registrar entrenamiento con 1..N ejercicios libres
export async function createWorkout(user: AuthUser, body: Record<string, unknown>) {
  const patientId = await resolvePatientId(user, body.patient);
  const doc = await Workout.create({
    patient: patientId,
    createdBy: user.id,
    date: body.date ? new Date(body.date as string | Date) : new Date(),
    notes: body.notes as string | undefined,
    perceivedIntensity: body.perceivedIntensity as number | undefined,
    exercises: body.exercises as IExercise[],
  });
  return doc;
}

// HU40 (paciente) / HU41 (nutricionista)
export async function listWorkouts(
  user: AuthUser,
  queryPatient?: unknown,
  exercise?: unknown,
) {
  const patientId = await resolvePatientId(user, queryPatient);
  const filter: Record<string, unknown> = { patient: patientId };
  if (typeof exercise === "string" && exercise.trim()) {
    filter["exercises.name"] = new RegExp(
      exercise.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }
  return Workout.find(filter).sort({ date: -1 });
}

export async function getWorkoutById(user: AuthUser, id: string) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const doc = await Workout.findById(id);
  if (!doc) throw notFound();
  await assertDocAccess(user, doc.patient);
  return doc;
}

// HU42 + RF-12
export async function updateWorkout(
  user: AuthUser,
  id: string,
  body: Record<string, unknown>,
) {
  const doc = await getWorkoutById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  if (body.date !== undefined) doc.date = new Date(body.date as string | Date);
  if (body.notes !== undefined) doc.notes = body.notes as string;
  if (body.perceivedIntensity !== undefined)
    doc.perceivedIntensity = body.perceivedIntensity as number;
  if (body.exercises !== undefined) doc.exercises = body.exercises as IExercise[];
  await doc.save();
  return doc;
}

export async function deleteWorkout(user: AuthUser, id: string) {
  const doc = await getWorkoutById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  await doc.deleteOne();
}
