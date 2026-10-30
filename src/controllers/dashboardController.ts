import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { getNutritionistDashboard } from "../services/dashboardService.js";

export async function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getNutritionistDashboard(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
