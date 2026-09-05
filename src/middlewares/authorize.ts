import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }
    next();
  };
}
