import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService.js";
import { AuthRequest } from "../middlewares/auth.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.registerNutritionist(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export function me(req: Request, res: Response) {
  // req.user inyectado por authenticate
  res.json({ success: true, data: (req as unknown as { user: unknown }).user });
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (err) {
    next(err);
  }
}