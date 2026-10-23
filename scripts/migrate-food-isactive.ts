import { connectDB } from "../src/config/db.js";
import { Food } from "../src/models/Food.js";

// Migración: los alimentos creados antes del borrado lógico no tienen isActive.
// Las consultas usan $ne:false, así que se consideran activos; este script
// normaliza el campo para dejar los documentos consistentes.
async function migrate() {
  await connectDB();
  const result = await Food.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } },
  );
  console.log(`Migración foods.isActive: ${result.modifiedCount} actualizados`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
