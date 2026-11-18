import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { Measurement } from "../models/Measurement.js";
import { Meal } from "../models/Meal.js";
import { Workout } from "../models/Workout.js";
import { PhysicalActivity } from "../models/PhysicalActivity.js";
import { Consultation } from "../models/Consultation.js";
import { Photo } from "../models/Photo.js";
import { Food } from "../models/Food.js";
import { computeMeasurementDerived } from "../services/measurementService.js";

const ADMIN = {
  name: "Nutricionista Admin",
  email: "admin@piaca.com",
  password: "admin123",
};

const PATIENT_PASSWORD = "demo1234";

const FOLD_KEYS = [
  "bicipital",
  "tricipital",
  "subescapular",
  "suprailiaco",
  "crural",
  "abdominal",
  "pectoral",
  "axilar",
  "peroneoGemelar",
] as const;

type FoldKey = (typeof FOLD_KEYS)[number];
type Folds = Record<FoldKey, number>;

type MeasurementSpec = { daysAgo: number; weight: number };
type ConsultationSpec = { daysAgo: number; observations: string; privateNotes: string };

type FoodItem = { name: string; grams: number };
type MealTemplate = FoodItem[];
type MealPlan = { hours: number[]; pool: MealTemplate[] };

type ExerciseSpec = {
  name: string;
  sets: number;
  reps: number;
  baseWeight: number;
  increment: number;
};
type WorkoutPlan = {
  days: number[];
  perceivedIntensity: number[];
  notes: string[];
  exercises: ExerciseSpec[];
};

type ActivitySpec = {
  daysAgo: number;
  type: string;
  duration: number;
  intensity: "baja" | "media" | "alta";
  notes: string;
};

type DemoPatient = {
  slug: string;
  fullName: string;
  email: string;
  dni: string;
  birthDate: string;
  sex: "M" | "F";
  phone: string;
  height: number;
  conditions: string[];
  otherConditions?: string;
  allergies?: string;
  foodPreferences?: string;
  goals: string;
  measurements: MeasurementSpec[];
  folds: Folds;
  foldTrend: number;
  consultations: ConsultationSpec[];
  mealPlan?: MealPlan;
  workoutPlan?: WorkoutPlan;
  activities: ActivitySpec[];
  photos: boolean;
};

const MEAL_PLANS: Record<string, MealPlan> = {
  valentina: {
    hours: [8, 12, 17, 21],
    pool: [
      [
        { name: "Avena", grams: 80 },
        { name: "Banana", grams: 150 },
        { name: "Leche entera", grams: 250 },
        { name: "Miel", grams: 15 },
      ],
      [
        { name: "Pollo pechuga", grams: 180 },
        { name: "Arroz blanco", grams: 250 },
        { name: "Brócoli", grams: 120 },
        { name: "Aceite de oliva", grams: 12 },
      ],
      [
        { name: "Yogur natural", grams: 250 },
        { name: "Chía", grams: 20 },
        { name: "Manzana", grams: 150 },
      ],
      [
        { name: "Carne vacuna magra", grams: 150 },
        { name: "Espinaca", grams: 120 },
        { name: "Arroz blanco", grams: 150 },
      ],
      [
        { name: "Huevo", grams: 120 },
        { name: "Avena", grams: 70 },
        { name: "Banana", grams: 120 },
        { name: "Leche entera", grams: 200 },
      ],
      [
        { name: "Pollo pechuga", grams: 170 },
        { name: "Arroz blanco", grams: 200 },
        { name: "Espinaca", grams: 100 },
        { name: "Aceite de oliva", grams: 10 },
      ],
    ],
  },
  mateo: {
    hours: [8, 13, 20],
    pool: [
      [
        { name: "Huevo", grams: 150 },
        { name: "Avena", grams: 70 },
        { name: "Banana", grams: 120 },
      ],
      [
        { name: "Pollo pechuga", grams: 200 },
        { name: "Arroz blanco", grams: 220 },
        { name: "Brócoli", grams: 150 },
      ],
      [
        { name: "Carne vacuna magra", grams: 180 },
        { name: "Espinaca", grams: 120 },
        { name: "Aceite de oliva", grams: 10 },
      ],
      [
        { name: "Clara de huevo", grams: 200 },
        { name: "Avena", grams: 60 },
        { name: "Manzana", grams: 150 },
      ],
      [
        { name: "Pollo pechuga", grams: 180 },
        { name: "Arroz blanco", grams: 180 },
        { name: "Brócoli", grams: 120 },
        { name: "Aceite de oliva", grams: 8 },
      ],
      [
        { name: "Queso cremoso", grams: 80 },
        { name: "Avena", grams: 50 },
        { name: "Banana", grams: 100 },
      ],
    ],
  },
  sofia: {
    hours: [8, 13, 20],
    pool: [
      [
        { name: "Huevo", grams: 130 },
        { name: "Avena", grams: 60 },
        { name: "Manzana", grams: 140 },
      ],
      [
        { name: "Queso cremoso", grams: 100 },
        { name: "Arroz blanco", grams: 200 },
        { name: "Brócoli", grams: 150 },
      ],
      [
        { name: "Yogur natural", grams: 200 },
        { name: "Chía", grams: 15 },
        { name: "Manzana", grams: 180 },
        { name: "Avena", grams: 30 },
      ],
      [
        { name: "Clara de huevo", grams: 200 },
        { name: "Avena", grams: 60 },
        { name: "Banana", grams: 100 },
      ],
      [
        { name: "Queso cremoso", grams: 80 },
        { name: "Espinaca", grams: 120 },
        { name: "Arroz blanco", grams: 150 },
      ],
      [
        { name: "Yogur natural", grams: 200 },
        { name: "Avena", grams: 50 },
        { name: "Miel", grams: 15 },
      ],
    ],
  },
  lucas: {
    hours: [8, 13, 20],
    pool: [
      [
        { name: "Clara de huevo", grams: 250 },
        { name: "Avena", grams: 80 },
        { name: "Manzana", grams: 150 },
      ],
      [
        { name: "Pollo pechuga", grams: 200 },
        { name: "Arroz blanco", grams: 200 },
        { name: "Brócoli", grams: 150 },
      ],
      [
        { name: "Manzana", grams: 150 },
        { name: "Yogur natural", grams: 250 },
        { name: "Avena", grams: 40 },
      ],
      [
        { name: "Huevo", grams: 150 },
        { name: "Avena", grams: 60 },
        { name: "Banana", grams: 120 },
      ],
      [
        { name: "Pollo pechuga", grams: 180 },
        { name: "Espinaca", grams: 150 },
        { name: "Aceite de oliva", grams: 10 },
        { name: "Arroz blanco", grams: 100 },
      ],
      [
        { name: "Yogur natural", grams: 250 },
        { name: "Chía", grams: 20 },
        { name: "Manzana", grams: 150 },
        { name: "Avena", grams: 30 },
      ],
    ],
  },
  carla: {
    hours: [9, 14, 20],
    pool: [
      [
        { name: "Huevo", grams: 180 },
        { name: "Brócoli", grams: 150 },
        { name: "Aceite de oliva", grams: 10 },
      ],
      [
        { name: "Pollo pechuga", grams: 200 },
        { name: "Brócoli", grams: 150 },
        { name: "Aceite de oliva", grams: 12 },
      ],
      [
        { name: "Queso cremoso", grams: 120 },
        { name: "Yogur natural", grams: 250 },
        { name: "Chía", grams: 20 },
      ],
      [
        { name: "Huevo", grams: 150 },
        { name: "Espinaca", grams: 120 },
        { name: "Aceite de oliva", grams: 10 },
      ],
      [
        { name: "Carne vacuna magra", grams: 180 },
        { name: "Espinaca", grams: 150 },
        { name: "Aceite de oliva", grams: 10 },
      ],
      [
        { name: "Yogur natural", grams: 250 },
        { name: "Manzana", grams: 100 },
        { name: "Chía", grams: 20 },
        { name: "Avena", grams: 30 },
      ],
    ],
  },
};

const WORKOUT_PLANS: Record<string, WorkoutPlan> = {
  mateo: {
    days: [28, 21, 14, 7, 2],
    perceivedIntensity: [6, 7, 7, 8, 8],
    notes: [
      "Primera semana de progresión",
      "Se sube carga en básicos",
      "Buena técnica en peso muerto",
      "Semana de mayor intensidad",
      "Cierre de bloque",
    ],
    exercises: [
      { name: "Sentadilla", sets: 4, reps: 8, baseWeight: 60, increment: 5 },
      { name: "Press banca", sets: 4, reps: 8, baseWeight: 50, increment: 4 },
      { name: "Peso muerto", sets: 3, reps: 6, baseWeight: 80, increment: 5 },
      { name: "Dominadas", sets: 3, reps: 8, baseWeight: 0, increment: 0 },
      { name: "Press militar", sets: 3, reps: 10, baseWeight: 30, increment: 2 },
    ],
  },
  lucas: {
    days: [27, 20, 13, 6, 1],
    perceivedIntensity: [7, 7, 8, 8, 9],
    notes: [
      "Adaptación a la rutina",
      "Foco en técnica de remo",
      "Se incrementa volumen",
      "Trabajo de brazos",
      "Última sesión del bloque",
    ],
    exercises: [
      { name: "Sentadilla", sets: 4, reps: 10, baseWeight: 45, increment: 5 },
      { name: "Press inclinado", sets: 4, reps: 10, baseWeight: 40, increment: 4 },
      { name: "Remo con barra", sets: 4, reps: 10, baseWeight: 45, increment: 5 },
      { name: "Curl bíceps", sets: 3, reps: 12, baseWeight: 12, increment: 2 },
      { name: "Extensión de tríceps", sets: 3, reps: 12, baseWeight: 15, increment: 2 },
    ],
  },
  carla: {
    days: [26, 19, 12, 5, 1],
    perceivedIntensity: [5, 6, 6, 7, 7],
    notes: [
      "Inicio con cargas moderadas",
      "Buena tolerancia al trabajo",
      "Se ajusta la técnica",
      "Progresión gradual",
      "Sesión de cierre",
    ],
    exercises: [
      { name: "Prensa de piernas", sets: 4, reps: 12, baseWeight: 80, increment: 10 },
      { name: "Jalón al pecho", sets: 4, reps: 12, baseWeight: 25, increment: 3 },
      { name: "Press hombros", sets: 3, reps: 12, baseWeight: 12, increment: 2 },
      { name: "Hip thrust", sets: 4, reps: 12, baseWeight: 50, increment: 8 },
      { name: "Remo en máquina", sets: 3, reps: 12, baseWeight: 30, increment: 3 },
    ],
  },
};

const DEMO_PATIENTS: DemoPatient[] = [
  {
    slug: "valentina",
    fullName: "Valentina Ríos",
    email: "valentina@demo.com",
    dni: "30111222",
    birthDate: "1998-03-12",
    sex: "F",
    phone: "+54 11 5555-0101",
    height: 168,
    conditions: ["Anemia ferropénica"],
    otherConditions: "Bajo peso constitucional",
    allergies: "Intolerancia a la lactosa",
    foodPreferences: "Prefiere comidas simples, evita lácteos",
    goals: "Aumentar masa muscular y alcanzar un peso saludable",
    measurements: [
      { daysAgo: 56, weight: 46.5 },
      { daysAgo: 42, weight: 47.2 },
      { daysAgo: 28, weight: 48.0 },
      { daysAgo: 14, weight: 48.6 },
      { daysAgo: 1, weight: 49.0 },
    ],
    folds: {
      bicipital: 5,
      tricipital: 12,
      subescapular: 8,
      suprailiaco: 7,
      crural: 14,
      abdominal: 9,
      pectoral: 6,
      axilar: 7,
      peroneoGemelar: 10,
    },
    foldTrend: 0.08,
    consultations: [
      {
        daysAgo: 28,
        observations: "Paciente refiere mejorar su energía diaria. Se ajusta plan hipercalórico.",
        privateNotes: "Controlar ferritina en el próximo estudio.",
      },
      {
        daysAgo: 1,
        observations: "Buena adherencia al plan. Ganancia de 1 kg en dos semanas.",
        privateNotes: "Evaluar suplementación de hierro.",
      },
    ],
    mealPlan: MEAL_PLANS.valentina,
    activities: [
      { daysAgo: 12, type: "Caminata", duration: 30, intensity: "baja", notes: "Al aire libre" },
      { daysAgo: 5, type: "Yoga", duration: 45, intensity: "baja", notes: "Movilidad y respiración" },
      { daysAgo: 1, type: "Bicicleta", duration: 30, intensity: "media", notes: "Ritmo suave" },
    ],
    photos: true,
  },
  {
    slug: "mateo",
    fullName: "Mateo Fernández",
    email: "mateo@demo.com",
    dni: "32444555",
    birthDate: "1994-06-05",
    sex: "M",
    phone: "+54 11 5555-0102",
    height: 178,
    conditions: [],
    otherConditions: "Sin patologías relevantes",
    allergies: "Ninguna",
    foodPreferences: "Alta ingesta de proteína, le gusta el pollo",
    goals: "Recomposición corporal y fuerza",
    measurements: [
      { daysAgo: 56, weight: 72.0 },
      { daysAgo: 42, weight: 71.2 },
      { daysAgo: 28, weight: 70.5 },
      { daysAgo: 14, weight: 69.9 },
      { daysAgo: 1, weight: 69.5 },
    ],
    folds: {
      bicipital: 4,
      tricipital: 8,
      subescapular: 10,
      suprailiaco: 8,
      crural: 10,
      abdominal: 12,
      pectoral: 7,
      axilar: 6,
      peroneoGemelar: 9,
    },
    foldTrend: -0.06,
    consultations: [
      {
        daysAgo: 28,
        observations: "Progreso sostenido, se mantiene déficit leve.",
        privateNotes: "Revisar adherencia al entrenamiento.",
      },
      {
        daysAgo: 1,
        observations: "Peso estable y mejor composición corporal.",
        privateNotes: "Ajustar carbohidratos pre-entreno.",
      },
    ],
    mealPlan: MEAL_PLANS.mateo,
    workoutPlan: WORKOUT_PLANS.mateo,
    activities: [
      { daysAgo: 10, type: "Running", duration: 30, intensity: "alta", notes: "Intervalos" },
      { daysAgo: 4, type: "Fútbol", duration: 60, intensity: "alta", notes: "Partido con amigos" },
      { daysAgo: 1, type: "Caminata", duration: 40, intensity: "baja", notes: "Recuperación" },
    ],
    photos: false,
  },
  {
    slug: "sofia",
    fullName: "Sofía Gómez",
    email: "sofia@demo.com",
    dni: "27666777",
    birthDate: "1985-11-20",
    sex: "F",
    phone: "+54 11 5555-0103",
    height: 162,
    conditions: ["Hipotiroidismo controlado"],
    allergies: "Ninguna",
    foodPreferences: "Vegetariana ovoláctea",
    goals: "Mantener peso y mejorar hábitos",
    measurements: [
      { daysAgo: 56, weight: 64.0 },
      { daysAgo: 42, weight: 63.2 },
      { daysAgo: 28, weight: 62.6 },
      { daysAgo: 14, weight: 62.0 },
      { daysAgo: 1, weight: 61.5 },
    ],
    folds: {
      bicipital: 8,
      tricipital: 16,
      subescapular: 12,
      suprailiaco: 10,
      crural: 20,
      abdominal: 16,
      pectoral: 10,
      axilar: 9,
      peroneoGemelar: 14,
    },
    foldTrend: -0.05,
    consultations: [
      {
        daysAgo: 28,
        observations: "Se refuerza incorporación de proteína vegetal.",
        privateNotes: "Solicitar TSH actualizado.",
      },
      {
        daysAgo: 1,
        observations: "Buena evolución, refiere más energía.",
        privateNotes: "Mantener plan actual.",
      },
    ],
    mealPlan: MEAL_PLANS.sofia,
    activities: [
      { daysAgo: 14, type: "Yoga", duration: 60, intensity: "baja", notes: "Clase guiada" },
      { daysAgo: 6, type: "Pilates", duration: 50, intensity: "media", notes: "Core y postura" },
      { daysAgo: 2, type: "Caminata", duration: 35, intensity: "baja", notes: "Parque" },
    ],
    photos: false,
  },
  {
    slug: "lucas",
    fullName: "Lucas Pereyra",
    email: "lucas@demo.com",
    dni: "35888999",
    birthDate: "2001-02-14",
    sex: "M",
    phone: "+54 11 5555-0104",
    height: 180,
    conditions: [],
    allergies: "Ninguna",
    foodPreferences: "Come fuera de casa con frecuencia",
    goals: "Descenso de grasa y mejora del rendimiento",
    measurements: [
      { daysAgo: 56, weight: 84.0 },
      { daysAgo: 42, weight: 84.8 },
      { daysAgo: 28, weight: 85.7 },
      { daysAgo: 14, weight: 86.6 },
      { daysAgo: 1, weight: 87.5 },
    ],
    folds: {
      bicipital: 6,
      tricipital: 14,
      subescapular: 16,
      suprailiaco: 18,
      crural: 16,
      abdominal: 22,
      pectoral: 12,
      axilar: 11,
      peroneoGemelar: 13,
    },
    foldTrend: 0.07,
    consultations: [
      {
        daysAgo: 28,
        observations: "Se pauta déficit moderado y registro de comidas.",
        privateNotes: "Revisar fines de semana.",
      },
      {
        daysAgo: 1,
        observations: "Refiere dificultad para sostener el déficit.",
        privateNotes: "Ajustar estrategia de saciedad.",
      },
    ],
    mealPlan: MEAL_PLANS.lucas,
    workoutPlan: WORKOUT_PLANS.lucas,
    activities: [
      { daysAgo: 9, type: "Natación", duration: 40, intensity: "media", notes: "Técnica libre" },
      { daysAgo: 3, type: "Running", duration: 25, intensity: "alta", notes: "Series" },
      { daysAgo: 1, type: "Bicicleta", duration: 45, intensity: "media", notes: "Ritmo constante" },
    ],
    photos: false,
  },
  {
    slug: "carla",
    fullName: "Carla Domínguez",
    email: "carla@demo.com",
    dni: "33123456",
    birthDate: "1991-07-08",
    sex: "F",
    phone: "+54 11 5555-0105",
    height: 160,
    conditions: ["Resistencia a la insulina"],
    otherConditions: "Síndrome metabólico en seguimiento",
    allergies: "Ninguna",
    foodPreferences: "Le gustan las preparaciones dulces",
    goals: "Descenso de peso y control glucémico",
    measurements: [
      { daysAgo: 56, weight: 79.0 },
      { daysAgo: 42, weight: 79.8 },
      { daysAgo: 28, weight: 80.6 },
      { daysAgo: 14, weight: 81.3 },
      { daysAgo: 1, weight: 82.0 },
    ],
    folds: {
      bicipital: 14,
      tricipital: 26,
      subescapular: 22,
      suprailiaco: 24,
      crural: 30,
      abdominal: 28,
      pectoral: 18,
      axilar: 16,
      peroneoGemelar: 20,
    },
    foldTrend: 0.06,
    consultations: [
      {
        daysAgo: 28,
        observations: "Se ajusta plan con menor carga glucémica.",
        privateNotes: "Derivar a control clínico.",
      },
      {
        daysAgo: 1,
        observations: "Glucemia en ayunas mejoró levemente.",
        privateNotes: "Continuar con el plan.",
      },
    ],
    mealPlan: MEAL_PLANS.carla,
    workoutPlan: WORKOUT_PLANS.carla,
    activities: [
      { daysAgo: 8, type: "Caminata", duration: 45, intensity: "baja", notes: "Cinta inclinada" },
      { daysAgo: 4, type: "Natación", duration: 30, intensity: "media", notes: "Estilo espalda" },
      { daysAgo: 1, type: "Yoga", duration: 40, intensity: "baja", notes: "Relajación" },
    ],
    photos: true,
  },
  {
    slug: "diego",
    fullName: "Diego Sosa",
    email: "diego@demo.com",
    dni: "25999888",
    birthDate: "1981-09-30",
    sex: "M",
    phone: "+54 11 5555-0106",
    height: 175,
    conditions: ["Hipertensión leve"],
    allergies: "Ninguna",
    foodPreferences: "Come en horarios irregulares",
    goals: "Mejorar composición corporal",
    measurements: [
      { daysAgo: 75, weight: 75.0 },
      { daysAgo: 60, weight: 74.2 },
      { daysAgo: 45, weight: 73.5 },
    ],
    folds: {
      bicipital: 8,
      tricipital: 14,
      subescapular: 14,
      suprailiaco: 12,
      crural: 14,
      abdominal: 16,
      pectoral: 10,
      axilar: 9,
      peroneoGemelar: 11,
    },
    foldTrend: -0.04,
    consultations: [
      {
        daysAgo: 60,
        observations: "Primera evaluación. Se solicita laboratorio.",
        privateNotes: "Paciente poco adherente.",
      },
      {
        daysAgo: 45,
        observations: "Sin novedades, se insiste en el registro.",
        privateNotes: "Recontactar en 30 días.",
      },
    ],
    activities: [],
    photos: false,
  },
];

const REQUIRED_FOODS = [
  "Pollo pechuga",
  "Arroz blanco",
  "Brócoli",
  "Aceite de oliva",
  "Huevo",
  "Clara de huevo",
  "Queso cremoso",
  "Avena",
  "Banana",
  "Leche entera",
  "Carne vacuna magra",
  "Espinaca",
  "Manzana",
  "Yogur natural",
  "Chía",
  "Miel",
];

type FoodMacros = { id: string; calories: number; protein: number; carbs: number; fat: number };

const NOW = new Date();

function daysAgo(days: number, hour = 10): Date {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

function makeFolds(base: Folds, trend: number, index: number, total: number): Folds {
  const factor = total <= 1 ? 0 : index / (total - 1);
  const folds = {} as Folds;
  for (const key of FOLD_KEYS) {
    folds[key] = Math.max(3, Math.round(base[key] * (1 + trend * factor)));
  }
  return folds;
}

function computeMealTotals(items: { food: string; grams: number }[], foodMap: Map<string, FoodMacros>) {
  const byId = new Map([...foodMap.values()].map((food) => [food.id, food]));
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const item of items) {
    const food = byId.get(item.food);
    if (!food) throw new Error(`Alimento no encontrado: ${item.food}`);
    totalCalories += (food.calories * item.grams) / 100;
    totalProtein += (food.protein * item.grams) / 100;
    totalCarbs += (food.carbs * item.grams) / 100;
    totalFat += (food.fat * item.grams) / 100;
  }

  return { totalCalories, totalProtein, totalCarbs, totalFat };
}

function resetUploads() {
  const dir = path.resolve("uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(dir)) {
    if (entry === ".gitkeep") continue;
    fs.unlinkSync(path.join(dir, entry));
  }
  const keep = path.join(dir, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
}

function copyPhotoAsset(slug: string, dateKeyValue: string, view: "frente" | "perfil" | "espalda"): string {
  const filename = `demo-${slug}-${dateKeyValue}-${view}.png`;
  const source = path.resolve("src", "seeds", "assets", `${view}.png`);
  fs.copyFileSync(source, path.resolve("uploads", filename));
  return filename;
}

async function resetDatabase() {
  await Promise.all([
    Photo.deleteMany({}),
    Measurement.deleteMany({}),
    Consultation.deleteMany({}),
    Meal.deleteMany({}),
    Workout.deleteMany({}),
    PhysicalActivity.deleteMany({}),
    Patient.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function seedDemo() {
  await connectDB();
  await resetDatabase();
  resetUploads();

  const admin = await User.create({ ...ADMIN, role: "nutritionist", isActive: true });

  const foods = await Food.find({ isActive: true });
  const foodMap = new Map<string, FoodMacros>();
  for (const food of foods) {
    foodMap.set(food.name, {
      id: String(food._id),
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
  }

  const missing = REQUIRED_FOODS.filter((name) => !foodMap.has(name));
  if (missing.length > 0) {
    throw new Error(`Faltan alimentos en la base: ${missing.join(", ")}. Ejecutá: npm run seed`);
  }

  const createdPatients: { fullName: string; email: string }[] = [];

  for (const spec of DEMO_PATIENTS) {
    const user = await User.create({
      name: spec.fullName,
      email: spec.email,
      password: PATIENT_PASSWORD,
      role: "patient",
      isActive: true,
    });

    const patient = await Patient.create({
      user: user._id,
      nutritionist: admin._id,
      fullName: spec.fullName,
      dni: spec.dni,
      birthDate: new Date(spec.birthDate),
      sex: spec.sex,
      phone: spec.phone,
      conditions: spec.conditions,
      otherConditions: spec.otherConditions,
      allergies: spec.allergies,
      foodPreferences: spec.foodPreferences,
      goals: spec.goals,
      isActive: true,
    });

    const consultationByDay = new Map<string, { id: string; date: Date }>();
    for (const consultation of spec.consultations) {
      const date = daysAgo(consultation.daysAgo, 11);
      const doc = await Consultation.create({
        patient: patient._id,
        nutritionist: admin._id,
        date,
        observations: consultation.observations,
        privateNotes: consultation.privateNotes,
      });
      consultationByDay.set(dayKey(date), { id: String(doc._id), date });
    }

    const totalMeasurements = spec.measurements.length;
    for (let index = 0; index < totalMeasurements; index += 1) {
      const measurementSpec = spec.measurements[index];
      const date = daysAgo(measurementSpec.daysAgo, 10);
      const consultation = consultationByDay.get(dayKey(date));

      if (!consultation) {
        await Measurement.create({
          patient: patient._id,
          createdBy: user._id,
          date,
          weight: measurementSpec.weight,
        });
        continue;
      }

      const folds = makeFolds(spec.folds, spec.foldTrend, index, totalMeasurements);
      const { fields } = await computeMeasurementDerived(
        String(patient._id),
        {
          weight: measurementSpec.weight,
          height: spec.height,
          bicipital: folds.bicipital,
          tricipital: folds.tricipital,
          subescapular: folds.subescapular,
          suprailiaco: folds.suprailiaco,
        },
        consultation.date,
      );

      await Measurement.create({
        patient: patient._id,
        createdBy: admin._id,
        date: consultation.date,
        weight: measurementSpec.weight,
        height: spec.height,
        ...folds,
        consultation: consultation.id,
        ...fields,
      });
    }

    if (spec.mealPlan) {
      const { hours, pool } = spec.mealPlan;
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const day = 6 - dayIndex;
        for (let slot = 0; slot < hours.length; slot += 1) {
          const template = pool[(dayIndex + slot) % pool.length];
          const items = template.map((item) => ({
            food: foodMap.get(item.name)!.id,
            grams: item.grams,
          }));
          const totals = computeMealTotals(items, foodMap);
          await Meal.create({
            patient: patient._id,
            createdBy: user._id,
            date: daysAgo(day, hours[slot]),
            items,
            ...totals,
          });
        }
      }
    }

    if (spec.workoutPlan) {
      const { days, perceivedIntensity, notes, exercises } = spec.workoutPlan;
      for (let index = 0; index < days.length; index += 1) {
        await Workout.create({
          patient: patient._id,
          createdBy: user._id,
          date: daysAgo(days[index], 18),
          notes: notes[index],
          perceivedIntensity: perceivedIntensity[index],
          exercises: exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.baseWeight + exercise.increment * index,
          })),
        });
      }
    }

    for (const activity of spec.activities) {
      await PhysicalActivity.create({
        patient: patient._id,
        createdBy: user._id,
        date: daysAgo(activity.daysAgo, 17),
        type: activity.type,
        duration: activity.duration,
        intensity: activity.intensity,
        notes: activity.notes,
      });
    }

    if (spec.photos) {
      const date = daysAgo(2, 9);
      for (const view of ["frente", "perfil", "espalda"] as const) {
        const filename = copyPhotoAsset(spec.slug, dayKey(date), view);
        const photoId = new mongoose.Types.ObjectId();
        await Photo.create({
          _id: photoId,
          patient: patient._id,
          createdBy: user._id,
          date,
          view,
          url: `/api/photos/${photoId}/file`,
          filename,
        });
      }
    }

    createdPatients.push({ fullName: spec.fullName, email: spec.email });
  }

  console.log("Seed demo completado.");
  console.log(`Admin: ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Contraseña de pacientes demo: ${PATIENT_PASSWORD}`);
  for (const patient of createdPatients) {
    console.log(`  - ${patient.fullName}: ${patient.email}`);
  }
  process.exit(0);
}

seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
