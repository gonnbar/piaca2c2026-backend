import { body } from "express-validator";

const profileFields = [
  body("dni").optional().trim().isNumeric().isLength({ min: 7, max: 8 }).withMessage("DNI inválido"),
  body("birthDate").optional().isISO8601().toDate(),
  body("sex").optional().isIn(["M", "F", "X"]),
  body("phone").optional().trim().notEmpty(),
  body("conditions").optional().isArray(),
  body("conditions.*").isString().trim().notEmpty(),
  body("otherConditions").optional().isString().trim(),
  body("allergies").optional().isString().trim(),
  body("foodPreferences").optional().isString().trim(),
  body("goals").optional().isString().trim(),
];

export const createPatientValidator = [
  body("fullName").trim().notEmpty().withMessage("Nombre completo requerido"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Contraseña mínimo 6 caracteres"),
  ...profileFields,
];

export const updatePatientValidator = [
  body("fullName").optional().trim().notEmpty(),
  ...profileFields,
];