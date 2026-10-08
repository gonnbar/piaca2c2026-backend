import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createConsultationValidator, updateConsultationValidator } from "../validators/consultation.js";
import * as consultationController from "../controllers/consultationController.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("nutritionist", "patient"), consultationController.list);
router.post("/", authorize("nutritionist"), createConsultationValidator, validate, consultationController.create);
router.get("/:id", authorize("nutritionist", "patient"), consultationController.getById);
router.patch("/:id", authorize("nutritionist"), updateConsultationValidator, validate, consultationController.update);
router.delete("/:id", authorize("nutritionist"), consultationController.remove);

export default router;