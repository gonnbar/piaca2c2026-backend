import mongoose from "mongoose";
import { Patient } from "../models/Patient.js";
import { User } from "../models/User.js";
import type { AuthUser } from "../middlewares/auth.js";

const notFound = () => Object.assign(new Error("Paciente no encontrado"), { statusCode: 404 });
const conflict = (msg: string) => Object.assign(new Error(msg), { statusCode: 409 });

const EDITABLE = {
  nutritionist: ["fullName", "birthDate", "sex", "dni", "phone", "conditions", "otherConditions", "allergies", "foodPreferences", "goals"],
  patient: ["phone"], // regla 2
} as const;

const pick = (obj: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type CreatePatientInput = {
  fullName: string;
  email: string;
  password: string;
  birthDate?: Date;
  sex?: "M" | "F" | "X";
  dni?: string;
  phone?: string;
  conditions?: string[];
  otherConditions?: string;
  allergies?: string;
  foodPreferences?: string;
  goals?: string;
};

export async function createPatient(nutritionistId: string, data: CreatePatientInput) {
  if (await User.exists({ email: data.email })) throw conflict("Email ya registrado");
  if (data.dni && (await Patient.exists({ dni: data.dni }))) throw conflict("DNI ya registrado");

  const user = await User.create({
    name: data.fullName,
    email: data.email,
    password: data.password,
    role: "patient",
  });

  try {
    const patient = await Patient.create({
      ...pick(data, EDITABLE.nutritionist),
      user: user._id,
      nutritionist: nutritionistId,
    });
    return { user, patient };
  } catch (err) {
    await User.findByIdAndDelete(user._id); // evita usuarios huérfanos
    throw err;
  }
}

export async function listPatients(nutritionistId: string, q?: string) {
  const filter: Record<string, unknown> = { nutritionist: nutritionistId, isActive: true };
  if (q?.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ fullName: rx }, { dni: rx }];
  }
  return Patient.find(filter).populate("user", "name email role").sort({ createdAt: -1 });
}

// Devuelve el paciente solo si el usuario tiene acceso (404 si no, para no filtrar su existencia)
export async function findAccessiblePatient(id: string, user: AuthUser) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const scope = user.role === "nutritionist" ? { nutritionist: user.id } : { user: user.id };
  const patient = await Patient.findOne({ _id: id, isActive: true, ...scope }).populate("user", "name email role");
  if (!patient) throw notFound();
  return patient;
}

export async function updatePatient(id: string, user: AuthUser, body: Record<string, unknown>) {
  const patient = await findAccessiblePatient(id, user);
  patient.set(pick(body, EDITABLE[user.role]));
  return patient.save();
}

export async function deactivatePatient(id: string, user: AuthUser) {
  const patient = await findAccessiblePatient(id, user);
  patient.isActive = false;
  await patient.save();
  await User.findByIdAndUpdate(patient.user, { isActive: false });
}