import { body } from "express-validator";

export const createPatientValidator = [
  body("fullName").trim().notEmpty().withMessage("Nombre completo requerido"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Contraseña mínimo 6 caracteres"),
  body("sex").optional().isIn(["M", "F", "X"]),
  body("height").optional().isFloat({ min: 0 }),
  body("weight").optional().isFloat({ min: 0 }),
];
