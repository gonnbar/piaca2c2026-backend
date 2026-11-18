import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { Meal } from "../models/Meal.js";
import { Food } from "../models/Food.js";
import { assertDocAccess, resolvePatientId } from "../services/patientScope.js";
import { assertEditWindow } from "../utils/editWindow.js";
import type { AuthRequest } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate);

async function computeTotals(items: { food: string; grams: number }[]) {
  const ids = items.map((i) => i.food);
  const foods = await Food.find({ _id: { $in: ids } });
  const map = new Map(foods.map((f) => [String(f._id), f]));
  let totalCalories = 0,
    totalProtein = 0,
    totalCarbs = 0,
    totalFat = 0;
  for (const item of items) {
    const f = map.get(String(item.food));
    if (!f) throw Object.assign(new Error(`Alimento no encontrado: ${item.food}`), { statusCode: 404 });
    // Los alimentos con borrado lógico no pueden usarse en comidas nuevas.
    if (f.isActive === false) {
      throw Object.assign(new Error(`Alimento no disponible: ${f.name}`), { statusCode: 400 });
    }
    totalCalories += (f.calories * item.grams) / 100;
    totalProtein += (f.protein * item.grams) / 100;
    totalCarbs += (f.carbs * item.grams) / 100;
    totalFat += (f.fat * item.grams) / 100;
  }
  return { totalCalories, totalProtein, totalCarbs, totalFat };
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    // Paciente: siempre sus propias comidas. Nutricionista: exige patient válido y propio.
    const patientId = await resolvePatientId(req.user!, req.query.patient);
    const filter: Record<string, unknown> = { patient: patientId };
    if (req.query.date) filter.date = { $gte: new Date(req.query.date as string) };
    const data = await Meal.find(filter).populate("items.food").sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    // Valida el alcance: paciente solo sus comidas; nutricionista solo sus pacientes.
    const patientId = await resolvePatientId(req.user!, req.body.patient);
    const totals = await computeTotals(req.body.items);
    const meal = await Meal.create({
      ...req.body,
      patient: patientId,
      createdBy: req.user!.id,
      ...totals,
    });
    res.status(201).json({ success: true, data: meal });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Meal.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    await assertDocAccess(req.user!, doc.patient);
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    // No se permite reasignar la comida a otro paciente.
    delete req.body.patient;
    if (req.body.items) {
      const totals = await computeTotals(req.body.items);
      Object.assign(doc, req.body, totals);
    } else {
      Object.assign(doc, req.body);
    }
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Meal.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    await assertDocAccess(req.user!, doc.patient);
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
