import fs from "fs";
import mongoose from "mongoose";
import { Photo } from "../models/Photo.js";
import { assertEditWindow } from "../utils/editWindow.js";
import { resolvePatientId, assertDocAccess } from "./patientScope.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("No encontrado"), { statusCode: 404 });
const badRequest = (msg: string) => Object.assign(new Error(msg), { statusCode: 400 });

type PhotoView = "frente" | "perfil" | "espalda";

// Regla 4: el paciente puede registrar fotografías; Regla 18: el nutricionista las consulta.
export async function createPhoto(
  user: AuthUser,
  file: Express.Multer.File | undefined,
  body: Record<string, unknown>,
) {
  if (!file) throw badRequest("Imagen requerida");
  const patientId = await resolvePatientId(user, body.patient);
  const doc = await Photo.create({
    patient: patientId,
    createdBy: user.id,
    date: body.date ? new Date(body.date as string | Date) : new Date(),
    view: body.view as PhotoView,
    notes: body.notes as string | undefined,
    url: `/uploads/${file.filename}`,
    filename: file.filename,
  });
  return doc;
}

export async function listPhotos(
  user: AuthUser,
  queryPatient?: unknown,
  view?: unknown,
) {
  const patientId = await resolvePatientId(user, queryPatient);
  const filter: Record<string, unknown> = { patient: patientId };
  if (view === "frente" || view === "perfil" || view === "espalda") filter.view = view;
  return Photo.find(filter).sort({ date: -1 });
}

export async function getPhotoById(user: AuthUser, id: string) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const doc = await Photo.findById(id);
  if (!doc) throw notFound();
  await assertDocAccess(user, doc.patient);
  return doc;
}

// Fotos: sin PUT (inmutables); DELETE con ventana de 10 min para paciente (RF-12).
export async function deletePhoto(user: AuthUser, id: string) {
  const doc = await getPhotoById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  await doc.deleteOne();
  // Mejor esfuerzo: borrar el archivo físico sin romper la respuesta API
  fs.unlink(`uploads/${doc.filename}`, () => undefined);
}
