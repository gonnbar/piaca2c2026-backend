import { body } from "express-validator";

const skinfolds = [
  "bicipital",
  "tricipital",
  "subescapular",
  "suprailiaco",
  "crural",
  "abdominal",
  "pectoral",
  "axilar",
  "peroneoGemelar",
];

const measurementFields = [
  body("date").optional({ values: "null" }).isISO8601().withMessage("Fecha inválida").toDate(),
  body("weight")
    .optional({ values: "null" })
    .isFloat({ gt: 0, max: 500 })
    .withMessage("Peso inválido (kg)")
    .toFloat(),
  body("height")
    .optional({ values: "null" })
    .isFloat({ gt: 0, max: 250 })
    .withMessage("Altura inválida (cm)")
    .toFloat(),
  ...skinfolds.map((fold) =>
    body(fold)
      .optional({ values: "null" })
      .isFloat({ gt: 0, max: 100 })
      .withMessage(`Pliegue ${fold} inválido (mm)`)
      .toFloat(),
  ),
];

export const createMeasurementValidator = measurementFields;
export const updateMeasurementValidator = measurementFields;
