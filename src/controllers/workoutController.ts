import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as service from "../services/workoutService.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.createWorkout(req.user!, req.body as Record<string, unknown>);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.listWorkouts(
      req.user!,
      req.query.patient,
      req.query.exercise,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.getWorkoutById(req.user!, req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.updateWorkout(
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
    await service.deleteWorkout(req.user!, req.params.id as string);
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
}
