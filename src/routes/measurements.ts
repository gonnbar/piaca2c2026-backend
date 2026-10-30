import { Router, type NextFunction, type Response } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { Measurement } from "../models/Measurement.js";
import { assertDocAccess, resolvePatientId } from "../services/patientScope.js";
import { computeMeasurementDerived } from "../services/measurementService.js";
import { createMeasurementValidator, updateMeasurementValidator } from "../validators/measurement.js";
import { assertEditWindow } from "../utils/editWindow.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

const MEASUREMENT_FIELDS = [
  "weight",
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
] as const;

const pickMeasurement = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => (MEASUREMENT_FIELDS as readonly string[]).includes(key)));

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
  "imc",
  "bodyFatPercentage",
  "musclePercentage",
  "fatMass",
  "leanMass",
  "bodyFatMethod",
  "bodyFatMethodVersion",
];

function assertMeasurementRole(body: Record<string, unknown>, role: string) {
  if (role === "nutritionist") return;
  const forbidden = NUTRITIONIST_ONLY_FIELDS.filter(
    (field) => body[field] !== undefined && body[field] !== null && body[field] !== "",
  );
  if (forbidden.length > 0) {
    throw Object.assign(new Error("Solo el nutricionista puede registrar altura y pliegues"), {
      statusCode: 403,
    });
  }
}

const notFound = () => Object.assign(new Error("Medición no encontrada"), { statusCode: 404 });

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patientId = await resolvePatientId(req.user!, req.query.patient);
    const data = await Measurement.find({ patient: patientId }).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", createMeasurementValidator, validate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    assertMeasurementRole(req.body, req.user!.role);

    const patientId = await resolvePatientId(req.user!, req.body.patient);
    const date = req.body.date instanceof Date ? req.body.date : new Date();

    const { anthropometry, fields } = await computeMeasurementDerived(
      patientId,
      { ...req.body, date },
      date,
    );

    const measurement = await Measurement.create({
      ...pickMeasurement(req.body),
      patient: patientId,
      createdBy: req.user!.id,
      date,
      ...fields,
    });

    res.status(201).json({ success: true, data: measurement, anthropometry });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", updateMeasurementValidator, validate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await Measurement.findById(req.params.id);
    if (!doc) throw notFound();

    await assertDocAccess(req.user!, doc.patient);
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    assertMeasurementRole(req.body, req.user!.role);

    const date = req.body.date instanceof Date ? req.body.date : (doc.date ?? new Date());
    const mergedInput = { ...doc.toObject(), ...pickMeasurement(req.body), date };

    const { anthropometry, fields } = await computeMeasurementDerived(
      String(doc.patient),
      mergedInput,
      date,
    );

    Object.assign(doc, pickMeasurement(req.body));
    if (req.body.date instanceof Date) doc.date = req.body.date;
    Object.assign(doc, fields);
    await doc.save();

    res.json({ success: true, data: doc, anthropometry });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await Measurement.findById(req.params.id);
    if (!doc) throw notFound();

    await assertDocAccess(req.user!, doc.patient);
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });

    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
