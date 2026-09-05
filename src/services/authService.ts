import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isActive) throw Object.assign(new Error("Credenciales inválidas"), { statusCode: 401 });
  const ok = await user.comparePassword(password);
  if (!ok) throw Object.assign(new Error("Credenciales inválidas"), { statusCode: 401 });

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
}

export async function registerNutritionist(data: { name: string; email: string; password: string }) {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw Object.assign(new Error("Email ya registrado"), { statusCode: 409 });
  const user = await User.create({ ...data, role: "nutritionist" });
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
