import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { Consultation } from "../models/Consultation.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.patient) filter.patient = req.query.patient;
    const data = await Consultation.find(filter).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", authorize("nutritionist"), async (req: AuthRequest, res, next) => {
  try {
    const doc = await Consultation.create({ ...req.body, nutritionist: req.user!.id });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Consultation.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
