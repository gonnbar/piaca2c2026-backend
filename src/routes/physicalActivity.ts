import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { PhysicalActivity } from "../models/PhysicalActivity.js";
import { assertEditWindow } from "../utils/editWindow.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.patient) filter.patient = req.query.patient;
    const data = await PhysicalActivity.find(filter).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const doc = await PhysicalActivity.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await PhysicalActivity.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await PhysicalActivity.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
