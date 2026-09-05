import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createPatientValidator } from "../validators/patient.js";
import * as ctrl from "../controllers/patientController.js";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/", authorize("nutritionist"), createPatientValidator, validate, ctrl.create);
router.put("/:id", authorize("nutritionist"), ctrl.update);
router.delete("/:id", authorize("nutritionist"), ctrl.remove);

export default router;
