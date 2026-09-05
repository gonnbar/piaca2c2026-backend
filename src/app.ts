import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import foodRoutes from "./routes/foods.js";
import measurementRoutes from "./routes/measurements.js";
import mealRoutes from "./routes/meals.js";
import workoutRoutes from "./routes/workouts.js";
import physicalActivityRoutes from "./routes/physicalActivity.js";
import photoRoutes from "./routes/photos.js";
import consultationRoutes from "./routes/consultations.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static para fotos
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "PIACA API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/physical-activity", physicalActivityRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/consultations", consultationRoutes);

app.use(errorHandler);

export default app;
