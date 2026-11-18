import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Photo } from "../models/Photo.js";
import { assertEditWindow } from "../utils/editWindow.js";
import { resolvePatientId, assertDocAccess } from "./patientScope.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("No encontrado"), { statusCode: 404 });
const badRequest = (msg: string) => Object.assign(new Error(msg), { statusCode: 400 });
const conflict = (msg: string) => Object.assign(new Error(msg), { statusCode: 409 });

type PhotoView = "frente" | "perfil" | "espalda";

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDayRange(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

// Regla 4: el paciente puede registrar fotografías; Regla 18: el nutricionista las consulta.
export async function createPhoto(
  user: AuthUser,
  file: Express.Multer.File | undefined,
  body: Record<string, unknown>,
) {
  if (!file) throw badRequest("Imagen requerida");
  const patientId = await resolvePatientId(user, body.patient);
  const date = body.date ? new Date(body.date as string | Date) : new Date();
  if (Number.isNaN(date.getTime())) throw badRequest("Fecha inválida");
  const view = body.view as PhotoView;
  const { start, end } = utcDayRange(date);
  const existing = await Photo.exists({
    patient: patientId,
    view,
    date: { $gte: start, $lt: end },
  });
  if (existing) {
    throw conflict(`Ya existe una foto de ${view} para esa fecha. Reemplazala desde la galería.`);
  }
  const _id = new mongoose.Types.ObjectId();
  const doc = await Photo.create({
    _id,
    patient: patientId,
    createdBy: user.id,
    date,
    view,
    notes: body.notes as string | undefined,
    url: `/api/photos/${_id}/file`,
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

// Reemplazo con ventana de 10 min para paciente; el nutricionista conserva capacidad administrativa.
export async function replacePhoto(
  user: AuthUser,
  id: string,
  file: Express.Multer.File | undefined,
  body: Record<string, unknown>,
) {
  if (!file) throw badRequest("Imagen requerida");
  const doc = await getPhotoById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });

  const previousFilename = doc.filename;
  doc.filename = file.filename;
  doc.url = `/api/photos/${doc._id}/file`;
  if (body.notes !== undefined) doc.notes = body.notes as string | undefined;
  await doc.save();

  // Mejor esfuerzo: borrar el archivo anterior sin romper la respuesta API
  if (previousFilename) {
    fs.unlink(path.resolve("uploads", previousFilename), () => undefined);
  }
  return doc;
}

export async function getPhotoFile(user: AuthUser, id: string) {
  const doc = await getPhotoById(user, id);
  const uploadsDir = path.resolve("uploads");
  const filePath = path.resolve(uploadsDir, doc.filename);
  if (!filePath.startsWith(`${uploadsDir}${path.sep}`) || !fs.existsSync(filePath)) {
    throw notFound();
  }
  return { doc, filePath };
}

// DELETE con ventana de 10 min para paciente (RF-12).
export async function deletePhoto(user: AuthUser, id: string) {
  const doc = await getPhotoById(user, id);
  assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: user.role });
  await doc.deleteOne();
  // Mejor esfuerzo: borrar el archivo físico sin romper la respuesta API
  fs.unlink(path.resolve("uploads", doc.filename), () => undefined);
}
