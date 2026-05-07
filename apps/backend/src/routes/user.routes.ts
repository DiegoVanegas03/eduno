import { Router } from "express";
import { updateProfile } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateProfileSchema } from "../schemas/user.schema";

const router = Router();

router.patch("/profile", isAuthenticated, validate(updateProfileSchema), updateProfile);

export default router;
