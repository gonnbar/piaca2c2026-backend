import { Router } from "express";
import { login, register, me, changePassword } from "../controllers/authController.js";
import { loginValidator, registerValidator, changePasswordValidator } from "../validators/auth.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/login", loginValidator, validate, login);
router.post("/register", registerValidator, validate, register);
router.get("/me", authenticate, me);
router.patch("/password", authenticate, changePasswordValidator, validate, changePassword);

export default router;
