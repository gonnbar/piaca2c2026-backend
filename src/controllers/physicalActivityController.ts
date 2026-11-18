import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as service from "../services/physicalActivityService.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.createActivity(req.user!, req.body as Record<string, unknown>);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.listActivities(req.user!, req.query.patient);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.getActivityById(req.user!, req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.updateActivity(
      req.user!,
      req.params.id as string,
      req.body as Record<string, unknown>,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteActivity(req.user!, req.params.id as string);
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
}
