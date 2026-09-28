import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export type AuthUser = {
  id: string;
  role: "nutritionist" | "patient";
  email: string;
};

export type AuthRequest = Request & { user?: AuthUser };

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    const user = await User.findById(payload.id).select("isActive role");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Usuario inactivo o inexistente" });
    }
    req.user = { id: payload.id, role: user.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
}