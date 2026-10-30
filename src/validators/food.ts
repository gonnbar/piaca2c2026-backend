import { body } from "express-validator";
import { FOOD_CATEGORIES } from "../utils/foodCategories.js";

const categories = [...FOOD_CATEGORIES];

const name = () =>
  body("name")
    .isString()
    .withMessage("El nombre es obligatorio")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("El nombre debe tener entre 2 y 120 caracteres");

const category = () =>
  body("category")
    .notEmpty()
    .withMessage("La categoría es obligatoria")
    .isIn(categories)
    .withMessage("Categoría inválida");

const macro = (field: string) =>
  body(field)
    .isFloat({ min: 0, max: 100 })
    .withMessage(`${field} debe estar entre 0 y 100`);

const foodValidator = [
  name(),
  category(),
  macro("protein"),
  macro("carbs"),
  macro("fat"),
];

export const createFoodValidator = foodValidator;
export const updateFoodValidator = foodValidator;
