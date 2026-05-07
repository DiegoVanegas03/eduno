import { Router } from "express";
import { updateProfile } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import multer from "multer";
import { updateProfileSchema } from "../schemas/user.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.patch(
  "/profile",
  isAuthenticated,
  upload.single("image"),
  validate(updateProfileSchema),
  updateProfile
);

export default router;
