import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array(),
    });
  }
  next();
}
