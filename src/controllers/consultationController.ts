import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as consultationService from "../services/consultationService.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await consultationService.createConsultation(req.user!, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const patientId = typeof req.query.patient === "string" ? req.query.patient : undefined;
    const data = await consultationService.listConsultations(req.user!, patientId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await consultationService.getConsultation(req.params.id as string, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await consultationService.updateConsultation(req.params.id as string, req.user!, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await consultationService.deleteConsultation(req.params.id as string, req.user!);
    res.json({ success: true, message: "Consulta eliminada" });
  } catch (err) {
    next(err);
  }
}