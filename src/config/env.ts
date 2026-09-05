import dotenv from "dotenv";
dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: required("MONGODB_URI", "mongodb://localhost:27017/piaca"),
  JWT_SECRET: required("JWT_SECRET", "dev-secret-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
