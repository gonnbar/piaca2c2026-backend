import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createFoodValidator, updateFoodValidator } from "../validators/food.js";
import * as controller from "../controllers/foodController.js";

const router = Router();

router.use(authenticate);

// Consulta: ambos roles. Gestión: solo el nutricionista (administrador).
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize("nutritionist"), createFoodValidator, validate, controller.create);
router.put("/:id", authorize("nutritionist"), updateFoodValidator, validate, controller.update);
// Borrado lógico (nunca físico) + reactivación de un alimento eliminado.
router.delete("/:id", authorize("nutritionist"), controller.remove);
router.patch("/:id/restore", authorize("nutritionist"), controller.restore);

export default router;
