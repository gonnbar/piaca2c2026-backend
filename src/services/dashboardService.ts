import mongoose from "mongoose";
import { DASHBOARD_CONFIG } from "../config/dashboard.js";
import { Consultation } from "../models/Consultation.js";
import { Meal } from "../models/Meal.js";
import { Measurement } from "../models/Measurement.js";
import { Patient } from "../models/Patient.js";
import { Photo } from "../models/Photo.js";
import { PhysicalActivity } from "../models/PhysicalActivity.js";
import { Workout } from "../models/Workout.js";
import type { AuthUser } from "../middlewares/auth.js";

export type DashboardActivityType =
  | "consultation"
  | "measurement"
  | "meal"
  | "workout"
  | "physicalActivity"
  | "photo";

export type DashboardPatient = {
  _id: string;
  fullName: string;
  updatedAt: string;
  lastActivityAt: string | null;
  lastActivityType: DashboardActivityType | null;
  daysSinceLastActivity: number | null;
};

export type NutritionistDashboardSummary = {
  patients: number;
  consultations: number;
  consultationsLast30Days: number;
  recent: { _id: string; date: Date; patientId: string; patientName: string }[];
  metrics: {
    totalPatients: number;
    inactivePatients: number;
    newPatientsThisMonth: number;
    consultationsThisMonth: number;
    measurementsLast30Days: number;
    patientsWithRecentMeasurements: number;
    measurementsWithBodyFatLast30Days: number;
    mealsLast7Days: number;
    patientsWithRecentMeals: number;
    patientsWithoutRecentActivity: number;
  };
  recentPatients: DashboardPatient[];
  inactivePatients: DashboardPatient[];
};

type ActivityAggregateRow = { _id: mongoose.Types.ObjectId; last: Date };
type LastActivity = { date: Date; type: DashboardActivityType };

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_PRIORITY: Record<DashboardActivityType, number> = {
  consultation: 0,
  measurement: 1,
  meal: 2,
  workout: 3,
  physicalActivity: 4,
  photo: 5,
};

const daysAgo = (days: number, now: Date) => new Date(now.getTime() - days * DAY_MS);

const startOfMonthUTC = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

const startOfNextMonthUTC = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

const daysSince = (date: Date, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));

async function lastActivityRows<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  patientIds: mongoose.Types.ObjectId[],
): Promise<ActivityAggregateRow[]> {
  if (patientIds.length === 0) return [];
  return model.aggregate<ActivityAggregateRow>([
    { $match: { patient: { $in: patientIds } } },
    { $group: { _id: "$patient", last: { $max: "$date" } } },
  ]);
}

function mergeActivity(
  target: Map<string, LastActivity>,
  rows: ActivityAggregateRow[],
  type: DashboardActivityType,
) {
  for (const row of rows) {
    const key = String(row._id);
    const current = target.get(key);
    const isNewer = !current || row.last.getTime() > current.date.getTime();
    const sameDateHigherPriority =
      current !== undefined &&
      row.last.getTime() === current.date.getTime() &&
      ACTIVITY_PRIORITY[type] < ACTIVITY_PRIORITY[current.type];

    if (isNewer || sameDateHigherPriority) {
      target.set(key, { date: row.last, type });
    }
  }
}

export async function getNutritionistDashboard(user: AuthUser): Promise<NutritionistDashboardSummary> {
  const now = new Date();
  const monthStart = startOfMonthUTC(now);
  const nextMonthStart = startOfNextMonthUTC(now);
  const measurementCutoff = daysAgo(DASHBOARD_CONFIG.RECENT_MEASUREMENT_DAYS, now);
  const mealCutoff = daysAgo(DASHBOARD_CONFIG.RECENT_MEALS_DAYS, now);
  const inactivityCutoff = daysAgo(DASHBOARD_CONFIG.INACTIVITY_DAYS, now);

  const activePatients = await Patient.find({ nutritionist: user.id, isActive: true })
    .select("_id fullName createdAt updatedAt")
    .sort({ updatedAt: -1 });

  const activeIds = activePatients.map((patient) => patient._id as mongoose.Types.ObjectId);

  const [
    totalPatients,
    consultations,
    consultationsThisMonth,
    consultationsLast30Days,
    recentConsultations,
    measurementsLast30Days,
    measurementPatients,
    measurementsWithBodyFatLast30Days,
    mealsLast7Days,
    mealPatients,
    consultationActivity,
    measurementActivity,
    mealActivity,
    workoutActivity,
    physicalActivityActivity,
    photoActivity,
  ] = await Promise.all([
    Patient.countDocuments({ nutritionist: user.id }),
    Consultation.countDocuments({ patient: { $in: activeIds } }),
    Consultation.countDocuments({
      patient: { $in: activeIds },
      date: { $gte: monthStart, $lt: nextMonthStart },
    }),
    Consultation.countDocuments({
      patient: { $in: activeIds },
      date: { $gte: daysAgo(30, now) },
    }),
    Consultation.find({ patient: { $in: activeIds } })
      .sort({ date: -1 })
      .limit(DASHBOARD_CONFIG.LIST_LIMIT)
      .select("date patient"),
    Measurement.countDocuments({
      patient: { $in: activeIds },
      date: { $gte: measurementCutoff },
    }),
    Measurement.distinct("patient", {
      patient: { $in: activeIds },
      date: { $gte: measurementCutoff },
    }),
    Measurement.countDocuments({
      patient: { $in: activeIds },
      date: { $gte: measurementCutoff },
      bodyFatPercentage: { $ne: null },
    }),
    Meal.countDocuments({
      patient: { $in: activeIds },
      createdAt: { $gte: mealCutoff },
    }),
    Meal.distinct("patient", {
      patient: { $in: activeIds },
      createdAt: { $gte: mealCutoff },
    }),
    lastActivityRows(Consultation, activeIds),
    lastActivityRows(Measurement, activeIds),
    lastActivityRows(Meal, activeIds),
    lastActivityRows(Workout, activeIds),
    lastActivityRows(PhysicalActivity, activeIds),
    lastActivityRows(Photo, activeIds),
  ]);

  const lastActivityByPatient = new Map<string, LastActivity>();
  mergeActivity(lastActivityByPatient, consultationActivity, "consultation");
  mergeActivity(lastActivityByPatient, measurementActivity, "measurement");
  mergeActivity(lastActivityByPatient, mealActivity, "meal");
  mergeActivity(lastActivityByPatient, workoutActivity, "workout");
  mergeActivity(lastActivityByPatient, physicalActivityActivity, "physicalActivity");
  mergeActivity(lastActivityByPatient, photoActivity, "photo");

  const toDashboardPatient = (patient: (typeof activePatients)[number]): DashboardPatient => {
    const lastActivity = lastActivityByPatient.get(String(patient._id));
    const updatedAt = patient.updatedAt ?? patient.createdAt ?? now;

    return {
      _id: String(patient._id),
      fullName: patient.fullName,
      updatedAt: updatedAt.toISOString(),
      lastActivityAt: lastActivity ? lastActivity.date.toISOString() : null,
      lastActivityType: lastActivity?.type ?? null,
      daysSinceLastActivity: lastActivity ? daysSince(lastActivity.date, now) : null,
    };
  };

  const patientNameById = new Map(
    activePatients.map((patient) => [String(patient._id), patient.fullName]),
  );

  const newPatientsThisMonth = activePatients.filter((patient) => {
    const createdAt = patient.createdAt;
    return createdAt !== undefined && createdAt >= monthStart && createdAt < nextMonthStart;
  }).length;

  const inactiveAll = activePatients.filter((patient) => {
    const lastActivity = lastActivityByPatient.get(String(patient._id));
    const reference = lastActivity?.date ?? patient.createdAt;
    return reference !== undefined && reference < inactivityCutoff;
  });

  const inactivePatients = [...inactiveAll]
    .sort((a, b) => {
      const aReference = lastActivityByPatient.get(String(a._id))?.date ?? a.createdAt ?? now;
      const bReference = lastActivityByPatient.get(String(b._id))?.date ?? b.createdAt ?? now;
      return aReference.getTime() - bReference.getTime();
    })
    .slice(0, DASHBOARD_CONFIG.LIST_LIMIT)
    .map(toDashboardPatient);

  return {
    patients: activePatients.length,
    consultations,
    consultationsLast30Days,
    recent: recentConsultations.map((consultation) => ({
      _id: String(consultation._id),
      date: consultation.date,
      patientId: String(consultation.patient),
      patientName: patientNameById.get(String(consultation.patient)) ?? "",
    })),
    metrics: {
      totalPatients,
      inactivePatients: Math.max(0, totalPatients - activePatients.length),
      newPatientsThisMonth,
      consultationsThisMonth,
      measurementsLast30Days,
      patientsWithRecentMeasurements: measurementPatients.length,
      measurementsWithBodyFatLast30Days,
      mealsLast7Days,
      patientsWithRecentMeals: mealPatients.length,
      patientsWithoutRecentActivity: inactiveAll.length,
    },
    recentPatients: activePatients.slice(0, DASHBOARD_CONFIG.LIST_LIMIT).map(toDashboardPatient),
    inactivePatients,
  };
}
