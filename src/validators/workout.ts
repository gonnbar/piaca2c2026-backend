import { body } from "express-validator";

// RF-09 / Reglas 15-16: uno o más ejercicios, nombres libres, series/reps/carga.
// Modelo canónico: { patient, date, notes, perceivedIntensity, exercises: [{ name, sets, reps, weight, notes }] }
const exerciseRules = [
  body("exercises").isArray({ min: 1 }).withMessage("Se requiere al menos un ejercicio"),
  body("exercises.*.name")
    .trim()
    .notEmpty()
    .withMessage("Nombre de ejercicio requerido")
    .isLength({ max: 120 }),
  body("exercises.*.sets")
    .notEmpty()
    .isInt({ min: 1, max: 100 })
    .withMessage("Series debe ser entre 1 y 100")
    .toInt(),
  body("exercises.*.reps")
    .notEmpty()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Repeticiones debe ser entre 1 y 1000")
    .toInt(),
  body("exercises.*.weight")
    .notEmpty()
    .isFloat({ min: 0, max: 1000 })
    .withMessage("Carga debe ser entre 0 y 1000 kg")
    .toFloat(),
  body("exercises.*.notes").optional().isString().trim().isLength({ max: 500 }),
];

export const createWorkoutValidator = [
  body("patient").optional().isMongoId().withMessage("patient inválido"),
  body("date").optional().isISO8601().withMessage("Fecha inválida").toDate(),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
  body("perceivedIntensity")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Intensidad percibida debe ser entre 1 y 10")
    .toInt(),
  ...exerciseRules,
];

export const updateWorkoutValidator = [
  body("date").optional().isISO8601().withMessage("Fecha inválida").toDate(),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
  body("perceivedIntensity")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Intensidad percibida debe ser entre 1 y 10")
    .toInt(),
  body("exercises").optional().isArray({ min: 1 }).withMessage("Se requiere al menos un ejercicio"),
  body("exercises.*.name").optional().trim().notEmpty().isLength({ max: 120 }),
  body("exercises.*.sets").optional().isInt({ min: 1, max: 100 }).toInt(),
  body("exercises.*.reps").optional().isInt({ min: 1, max: 1000 }).toInt(),
  body("exercises.*.weight").optional().isFloat({ min: 0, max: 1000 }).toFloat(),
  body("exercises.*.notes").optional().isString().trim().isLength({ max: 500 }),
];
