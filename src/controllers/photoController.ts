import fs from "fs";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import * as service from "../services/photoService.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.createPhoto(
      req.user!,
      (req as AuthRequest & { file?: Express.Multer.File }).file,
      req.body as Record<string, unknown>,
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    // Si falla la creación, no dejar el archivo huérfano en disco
    const f = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (f?.path) fs.unlink(f.path, () => undefined);
    next(err);
  }
}

export async function replace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.replacePhoto(
      req.user!,
      req.params.id as string,
      (req as AuthRequest & { file?: Express.Multer.File }).file,
      req.body as Record<string, unknown>,
    );
    res.json({ success: true, data });
  } catch (err) {
    const f = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (f?.path) fs.unlink(f.path, () => undefined);
    next(err);
  }
}

export async function getFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { filePath } = await service.getPhotoFile(req.user!, req.params.id as string);
    res.setHeader("Cache-Control", "private, no-store");
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.listPhotos(
      req.user!,
      req.query.patient,
      req.query.view,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await service.getPhotoById(req.user!, req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.deletePhoto(req.user!, req.params.id as string);
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
}
