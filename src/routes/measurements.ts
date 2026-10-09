import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { Measurement } from "../models/Measurement.js";
import { getOwnPatient } from "../services/patientService.js";
import { calculateIMC } from "../utils/calculations.js";
import { assertEditWindow } from "../utils/editWindow.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.patient) filter.patient = req.query.patient;
    const data = await Measurement.find(filter).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Solo el nutricionista registra altura y pliegues (AGENTS.md: Roles).
// El paciente solo puede registrar peso y consultar sus mediciones.
const NUTRITIONIST_ONLY_FIELDS = [
  "height",
  "bicipital",
  "tricipital",
  "subescapular",
  "suprailiaco",
  "crural",
  "abdominal",
  "pectoral",
  "axilar",
  "peroneoGemelar",
  "bodyFatPercentage",
  "musclePercentage",
  "imc",
];

function assertMeasurementRole(body: Record<string, unknown>, role: string) {
  if (role === "nutritionist") return;
  const forbidden = NUTRITIONIST_ONLY_FIELDS.filter(
    (f) => body[f] !== undefined && body[f] !== null && body[f] !== "",
  );
  if (forbidden.length > 0) {
    throw Object.assign(
      new Error("Solo el nutricionista puede registrar altura y pliegues"),
      { statusCode: 403 },
    );
  }
}

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    assertMeasurementRole(req.body, req.user!.role);
    // Paciente solo registra su propio peso: fuerza patient al propio.
    if (req.user!.role === "patient") {
      const own = await getOwnPatient(req.user!.id);
      req.body.patient = String(own._id);
    }
    const payload = { ...req.body, createdBy: req.user!.id };
    if (payload.weight && payload.height) {
      payload.imc = calculateIMC(payload.weight, payload.height);
    }
    const measurement = await Measurement.create(payload);
    res.status(201).json({ success: true, data: measurement });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Measurement.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    assertMeasurementRole(req.body, req.user!.role);
    // Paciente no puede reasignar la medición a otro paciente.
    if (req.user!.role === "patient") {
      const own = await getOwnPatient(req.user!.id);
      if (String(doc.patient) !== String(own._id)) {
        return res.status(403).json({ success: false, message: "Acceso denegado" });
      }
      delete req.body.patient;
    }
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Measurement.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
