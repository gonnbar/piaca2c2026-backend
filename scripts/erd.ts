// import mongoose from "mongoose";
// import { mongooseToErdMain } from "mongoose-to-erd";
//
// // Importar todos los modelos
// import "../src/models/User";
// import "../src/models/Patient";
// import "../src/models/Consultation";
// import "../src/models/Food";
// import "../src/models/Meal";
// import "../src/models/Measurement";
// import "../src/models/Photo";
// import "../src/models/PhysicalActivity";
// import "../src/models/Workout";
// // Agregar los demás modelos
//
// async function generateERD() {
//   try {
//     const modelNames = mongoose.modelNames();
//
//     const { files } = await mongooseToErdMain(
//       modelNames,
//       mongoose.model,
//       {
//         outDir: "../docs/diagrams",
//         timestamp: false,
//       }
//     );
//
//     console.log("Diagramas generados:");
//     console.log(files);
//   } catch (error) {
//     console.error("Error generando DER:", error);
//     process.exitCode = 1;
//   }
// }
//
// generateERD();
import mongoose from "mongoose";
import { mongooseToErdMain } from "mongoose-to-erd";

// Importar todos los modelos
import "../src/models/User";
import "../src/models/Patient";
import "../src/models/Consultation";
import "../src/models/Food";
import "../src/models/Meal";
import "../src/models/Measurement";
import "../src/models/Photo";
import "../src/models/PhysicalActivity";
import "../src/models/Workout";

// Escapar campos que generan conflictos con D2
function escapeD2Fields(d2: string): string {
  return d2.replace(
    /^(\s*)height:/gm,
    '$1"height":'
  );
}

async function generateERD() {
  try {
    const modelNames = mongoose.modelNames();

    const { files } = await mongooseToErdMain(
      modelNames,
      mongoose.model,
      {
        outDir: "../docs/diagrams",
        timestamp: false,
        transformD2: escapeD2Fields,
      }
    );

    console.log("Diagramas generados:");
    console.log(files);
  } catch (error) {
    console.error("Error generando DER:", error);
    process.exitCode = 1;
  }
}

generateERD();
