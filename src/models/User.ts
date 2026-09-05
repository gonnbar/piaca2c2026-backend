import mongoose from "mongoose";
import bcrypt from "bcrypt";

export type UserRole = "nutritionist" | "patient";

export interface IUser extends mongoose.Document {
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["nutritionist", "patient"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform(_doc: unknown, ret: Record<string, unknown>) {
    delete ret.password;
    return ret;
  },
} as unknown as mongoose.SchemaOptions<IUser>["toJSON"]);

export const User = mongoose.model<IUser>("User", userSchema);
