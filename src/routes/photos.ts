import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { createPhotoValidator, replacePhotoValidator } from "../validators/photo.js";
import * as controller from "../controllers/photoController.js";

const router = Router();

router.use(authenticate);
router.use(authorize("nutritionist", "patient"));

// Fotografías de evolución (frente / perfil / espalda) — Multer multipart/form-data
router.get("/", controller.list);
router.post(
  "/",
  upload.single("image"),
  createPhotoValidator,
  validate,
  controller.create,
);
router.get("/:id/file", controller.getFile);
router.get("/:id", controller.getById);
router.put(
  "/:id",
  upload.single("image"),
  replacePhotoValidator,
  validate,
  controller.replace,
);
// DELETE con ventana de 10 min para paciente (RF-12)
router.delete("/:id", controller.remove);

export default router;
