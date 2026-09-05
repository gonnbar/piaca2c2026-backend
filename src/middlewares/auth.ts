import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthUser = {
  id: string;
  role: "nutritionist" | "patient";
  email: string;
};

export type AuthRequest = Request & { user?: AuthUser };

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
}
