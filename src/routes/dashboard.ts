import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import * as dashboardController from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate);
router.get("/summary", authorize("nutritionist"), dashboardController.summary);

export default router;
