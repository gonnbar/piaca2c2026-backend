import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { Meal } from "../models/Meal.js";
import { Food } from "../models/Food.js";
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
    totalCalories += (f.calories * item.grams) / 100;
    totalProtein += (f.protein * item.grams) / 100;
    totalCarbs += (f.carbs * item.grams) / 100;
    totalFat += (f.fat * item.grams) / 100;
  }
  return { totalCalories, totalProtein, totalCarbs, totalFat };
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.date) filter.date = { $gte: new Date(req.query.date as string) };
    const data = await Meal.find(filter).populate("items.food").sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const totals = await computeTotals(req.body.items);
    const meal = await Meal.create({ ...req.body, createdBy: req.user!.id, ...totals });
    res.status(201).json({ success: true, data: meal });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await Meal.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "No encontrado" });
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
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
    assertEditWindow({ createdAt: doc.createdAt as unknown as Date, userRole: req.user!.role });
    await doc.deleteOne();
    res.json({ success: true, message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});

export default router;
