import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si Multer ya guardó un archivo, no dejarlo huérfano cuando falla la validación.
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (file?.path) fs.unlink(file.path, () => undefined);
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array(),
    });
  }
  next();
}
