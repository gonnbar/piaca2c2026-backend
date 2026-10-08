import { body } from "express-validator";

const skinfolds = ["bicipital", "tricipital", "subescapular", "suprailiaco", "crural", "abdominal", "pectoral", "axilar", "peroneoGemelar"];

const measurementFields = [
  body("measurement").optional().isObject(),
  body("measurement.weight").optional().isFloat({ min: 1, max: 500 }).withMessage("Peso inválido (kg)"),
  body("measurement.height").optional().isFloat({ min: 50, max: 250 }).withMessage("Altura inválida (cm)"),
  ...skinfolds.map((f) => body(`measurement.${f}`).optional().isFloat({ min: 0, max: 100 }).withMessage(`Pliegue ${f} inválido (mm)`)),
];

export const createConsultationValidator = [
  body("patientId").isMongoId().withMessage("Paciente inválido"),
  body("date").optional().isISO8601().toDate(),
  body("observations").trim().notEmpty().withMessage("Observaciones requeridas"),
  body("privateNotes").optional().isString().trim(),
  ...measurementFields,
];

export const updateConsultationValidator = [
  body("date").optional().isISO8601().toDate(),
  body("observations").optional().trim().notEmpty(),
  body("privateNotes").optional().isString().trim(),
  ...measurementFields,
];