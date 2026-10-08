import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createWorkoutValidator, updateWorkoutValidator } from "../validators/workout.js";
import * as controller from "../controllers/workoutController.js";

const router = Router();

router.use(authenticate);
router.use(authorize("nutritionist", "patient"));

// RF-09 — Registro de entrenamiento de fuerza (ejercicios libres + series/reps/carga)
router.get("/", controller.list);
router.post("/", createWorkoutValidator, validate, controller.create);
router.get("/:id", controller.getById);
router.put("/:id", updateWorkoutValidator, validate, controller.update);
router.delete("/:id", controller.remove);

export default router;
