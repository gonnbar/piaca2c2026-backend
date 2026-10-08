import { body } from "express-validator";

// Fotos de evolución: frente / perfil / espalda (AGENTS.md). El archivo se valida vía Multer.
// `patient` es obligatorio para nutricionista y opcional para paciente
// (el servicio resuelve su propio Patient desde el JWT si no se envía).
export const createPhotoValidator = [
  body("patient").optional().isMongoId().withMessage("patient inválido"),
  body("view").notEmpty().withMessage("view requerido").isIn(["frente", "perfil", "espalda"]),
  body("date").optional().isISO8601().withMessage("Fecha inválida").toDate(),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
];
