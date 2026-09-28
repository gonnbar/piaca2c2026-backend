import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createPatientValidator, updatePatientValidator } from "../validators/patient.js";
import * as patientController from "../controllers/patientController.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("nutritionist"), patientController.list);
router.post("/", authorize("nutritionist"), createPatientValidator, validate, patientController.create);
router.get("/me", authorize("patient"), patientController.me);
router.get("/:id", authorize("nutritionist", "patient"), patientController.getById);
router.patch("/:id", authorize("nutritionist", "patient"), updatePatientValidator, validate, patientController.update);
router.delete("/:id", authorize("nutritionist"), patientController.remove);

export default router;