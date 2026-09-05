import { connectDB } from "../config/db.js";
import { Food } from "../models/Food.js";

const foods = [
  // Carnes
  { name: "Pollo pechuga", category: "carnes", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Carne vacuna magra", category: "carnes", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Cerdo magro", category: "carnes", calories: 242, protein: 27, carbs: 0, fat: 14 },
  // Huevos
  { name: "Huevo", category: "huevos", calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { name: "Clara de huevo", category: "huevos", calories: 52, protein: 10.9, carbs: 0.7, fat: 0.2 },
  // Lácteos
  { name: "Leche entera", category: "leche", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Queso cremoso", category: "quesos", calories: 300, protein: 18, carbs: 2, fat: 24 },
  { name: "Yogur natural", category: "yogur", calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3 },
  // Verduras
  { name: "Brócoli", category: "verduras", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { name: "Espinaca", category: "verduras", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  // Cereales
  { name: "Arroz blanco", category: "cereales", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Avena", category: "cereales", calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  // Frutas
  { name: "Banana", category: "frutas", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: "Manzana", category: "frutas", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  // Semillas / aceites / etc
  { name: "Chía", category: "semillas", calories: 486, protein: 16.5, carbs: 42, fat: 30.7 },
  { name: "Miel", category: "miel", calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: "Azúcar", category: "azucar", calories: 387, protein: 0, carbs: 100, fat: 0 },
  { name: "Aceite de oliva", category: "aceites", calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: "Manteca", category: "grasas", calories: 717, protein: 0.9, carbs: 0.6, fat: 81 },
] as const;

async function seed() {
  await connectDB();
  await Food.deleteMany({});
  await Food.insertMany(foods);
  console.log(`Seed foods: ${foods.length} insertados`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
