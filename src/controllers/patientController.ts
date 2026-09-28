import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as patientService from "../services/patientService.js";

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
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await patientService.listPatients(req.user!.id, q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await patientService.findAccessiblePatient(req.params.id as string, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await patientService.updatePatient(req.params.id as string, req.user!, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await patientService.deactivatePatient(req.params.id as string, req.user!);
    res.json({ success: true, message: "Paciente dado de baja" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await patientService.getOwnPatient(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}