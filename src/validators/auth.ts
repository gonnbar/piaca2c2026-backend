import { body } from "express-validator";

export const loginValidator = [
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").notEmpty().withMessage("Contraseña requerida"),
];

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Nombre requerido"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Contraseña mínimo 6 caracteres"),
  body("role").isIn(["nutritionist", "patient"]).withMessage("Rol inválido"),
];
