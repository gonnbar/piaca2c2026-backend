import { Patient } from "../models/Patient.js";
import { User } from "../models/User.js";

export async function createPatient(
  nutritionistId: string,
  data: {
    fullName: string;
    email: string;
    password: string;
    name?: string;
    sex?: string;
    phone?: string;
    height?: number;
    weight?: number;
    diseases?: string;
    allergies?: string;
    foodPreferences?: string;
  },
) {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw Object.assign(new Error("Email ya registrado"), { statusCode: 409 });

  const user = await User.create({
    name: data.name ?? data.fullName,
    email: data.email,
    password: data.password,
    role: "patient",
  });

  const patient = await Patient.create({
    user: user._id,
    nutritionist: nutritionistId,
    fullName: data.fullName,
    sex: data.sex as "M" | "F" | "X" | undefined,
    phone: data.phone,
    height: data.height,
    weight: data.weight,
    diseases: data.diseases,
    allergies: data.allergies,
    foodPreferences: data.foodPreferences,
  });

  return { user, patient };
}

export async function listPatients(nutritionistId?: string) {
  const filter = nutritionistId ? { nutritionist: nutritionistId } : {};
  return Patient.find(filter).populate("user", "name email role").sort({ createdAt: -1 });
}

export async function getPatientById(id: string) {
  const patient = await Patient.findById(id).populate("user", "name email role");
  if (!patient) throw Object.assign(new Error("Paciente no encontrado"), { statusCode: 404 });
  return patient;
}
