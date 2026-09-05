import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error & { statusCode?: number; errors?: unknown },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.statusCode ?? 500;
  const message = err.message || "Error interno del servidor";

  // No exponer stack en producción (AGENTS.md: Buenas prácticas)
  const payload: Record<string, unknown> = { success: false, message };
  if (env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  if (err.errors) payload.errors = err.errors;

  res.status(status).json(payload);
}
