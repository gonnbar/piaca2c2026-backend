import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error & { statusCode?: number; errors?: unknown; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // RNF-08: manejo centralizado. Multer (uploads) se expone como 400 con formato estándar.
  let status = err.statusCode ?? 500;
  if (err instanceof multer.MulterError || err.code === "LIMIT_FILE_SIZE") {
    status = 400;
  }
  const message =
    status === 500 ? "Error interno del servidor" : err.message || "Error en la solicitud";

  // No exponer stack en producción (AGENTS.md: Buenas prácticas)
  const payload: Record<string, unknown> = { success: false, message };
  if (env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  if (err.errors) payload.errors = err.errors;

  res.status(status).json(payload);
}
