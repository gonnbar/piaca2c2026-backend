import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import { Photo } from "../models/Photo.js";
import { assertEditWindow } from "../utils/editWindow.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.patient) filter.patient = req.query.patient;
    const data = await Photo.find(filter).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("image"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Imagen requerida" });
    const { patient, view, date } = req.body;
    if (!patient || !view) return res.status(400).json({ success: false, message: "patient y view requeridos" });

    const photo = await Photo.create({
      patient,
      view,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user!.id,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Photo.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
