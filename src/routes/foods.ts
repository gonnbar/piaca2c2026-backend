import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { Food } from "../models/Food.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    const foods = await Food.find(filter).sort({ name: 1 }).limit(200);
    res.json({ success: true, data: foods });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Alimento no encontrado" });
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
});

export default router;
