import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as patientService from "../services/patientService.js";
import { Patient } from "../models/Patient.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await patientService.createPatient(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result.patient });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Nutricionista ve sus pacientes; paciente no lista
    const patients = await patientService.listPatients(
      req.user!.role === "nutritionist" ? req.user!.id : undefined,
    );
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const patient = await patientService.getPatientById(req.params.id as string);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id as string, req.body, { new: true });
    if (!patient) throw Object.assign(new Error("Paciente no encontrado"), { statusCode: 404 });
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id as string, { isActive: false }, { new: true });
    if (!patient) throw Object.assign(new Error("Paciente no encontrado"), { statusCode: 404 });
    res.json({ success: true, message: "Paciente dado de baja" });
  } catch (err) {
    next(err);
  }
}
