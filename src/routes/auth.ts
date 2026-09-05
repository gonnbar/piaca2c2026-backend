import { Router } from "express";
import { login, register, me } from "../controllers/authController.js";
import { loginValidator, registerValidator } from "../validators/auth.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/login", loginValidator, validate, login);
router.post("/register", registerValidator, validate, register);
router.get("/me", authenticate, me);

export default router;
