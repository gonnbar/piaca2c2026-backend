import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createPhysicalActivityValidator,
  updatePhysicalActivityValidator,
} from "../validators/physicalActivity.js";
import * as controller from "../controllers/physicalActivityController.js";

const router = Router();

router.use(authenticate);
router.use(authorize("nutritionist", "patient"));

// RF-08 — Registro de actividad física (tipo, duración, intensidad, observaciones)
// Solo el paciente registra; el nutricionista consulta y corrige (PUT/DELETE).
router.get("/", controller.list);
router.post("/", authorize("patient"), createPhysicalActivityValidator, validate, controller.create);
router.get("/:id", controller.getById);
router.put("/:id", updatePhysicalActivityValidator, validate, controller.update);
router.delete("/:id", controller.remove);

export default router;
