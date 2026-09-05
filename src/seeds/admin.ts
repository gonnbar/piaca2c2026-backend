import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

async function seedAdmin() {
  await connectDB();
  const email = "admin@piaca.com";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin ya existe:", email);
    process.exit(0);
  }
  const admin = await User.create({
    name: "Nutricionista Admin",
    email,
    password: "admin123",
    role: "nutritionist",
  });
  console.log("Admin creado:", admin.email, "/ password: admin123");
  process.exit(0);
}

seedAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
