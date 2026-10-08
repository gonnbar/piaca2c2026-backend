import { body } from "express-validator";

// RF-08 / Regla 14: tipo, fecha, duración e intensidad mínimos + observaciones opcionales.
// Modelo canónico en inglés (type/duration/intensity/notes) — ver mapeo en el servicio.
export const createPhysicalActivityValidator = [
  body("patient").optional().isMongoId().withMessage("patient inválido"),
  body("type").trim().notEmpty().withMessage("Tipo requerido").isLength({ max: 120 }),
  body("date").optional().isISO8601().withMessage("Fecha inválida").toDate(),
  body("duration")
    .notEmpty()
    .withMessage("Duración requerida")
    .isFloat({ min: 1, max: 1440 })
    .withMessage("Duración debe ser entre 1 y 1440 minutos")
    .toFloat(),
  body("intensity")
    .optional()
    .isIn(["baja", "media", "alta"])
    .withMessage("Intensidad debe ser baja, media o alta"),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
];

export const updatePhysicalActivityValidator = [
  body("type").optional().trim().notEmpty().withMessage("Tipo inválido").isLength({ max: 120 }),
  body("date").optional().isISO8601().withMessage("Fecha inválida").toDate(),
  body("duration")
    .optional()
    .isFloat({ min: 1, max: 1440 })
    .withMessage("Duración debe ser entre 1 y 1440 minutos")
    .toFloat(),
  body("intensity")
    .optional()
    .isIn(["baja", "media", "alta"])
    .withMessage("Intensidad debe ser baja, media o alta"),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
];
