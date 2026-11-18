import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilterError(message: string) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith("image/") || !ALLOWED_EXT.has(ext)) {
      cb(fileFilterError("Solo se permiten imágenes (jpg, jpeg, png, webp)"));
    } else {
      cb(null, true);
    }
  },
});
