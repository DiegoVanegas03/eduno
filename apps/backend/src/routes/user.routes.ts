import { Router } from "express";
import {
  updatePassword,
  updateProfile,
  deleteAccount,
  getUserProfileForAdmin,
  toggleUserBanStatus,
  revokeUserSession,
  getUsersForAdmin,
  createUserForAdmin,
  updateUserForAdmin,
  deleteUserForAdmin,
  resendVerificationEmail,
} from "@/controllers/user.controller";
import { isAuthenticated, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import multer from "multer";
import {
  updateProfileSchema,
  updatePasswordSchema,
  backendDeleteAccountSchema,
  adminUserParamsSchema,
  adminSessionParamsSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "@/schemas/user.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.patch(
  "/profile",
  isAuthenticated,
  upload.single("image"),
  validate(updateProfileSchema),
  updateProfile
);

router.patch("/password", isAuthenticated, validate(updatePasswordSchema), updatePassword);

// DELETE /api/users/account — permanently removes the account after password verification
router.delete("/account", isAuthenticated, validate(backendDeleteAccountSchema), deleteAccount);

// Admin-only & Moderator-only user profile / sessions / ban management
router.get(
  "/",
  isAuthenticated,
  authorize("admin", "moderador"),
  getUsersForAdmin,
);
router.post(
  "/",
  isAuthenticated,
  authorize("admin"),
  validate(adminCreateUserSchema),
  createUserForAdmin,
);
router.patch(
  "/:id",
  isAuthenticated,
  authorize("admin"),
  validate(adminUpdateUserSchema),
  updateUserForAdmin,
);
router.delete(
  "/:id",
  isAuthenticated,
  authorize("admin"),
  validate(adminUserParamsSchema),
  deleteUserForAdmin,
);

router.get(
  "/:id",
  isAuthenticated,
  authorize("admin", "moderador"),
  validate(adminUserParamsSchema),
  getUserProfileForAdmin,
);
router.patch(
  "/:id/ban",
  isAuthenticated,
  authorize("admin"),
  validate(adminUserParamsSchema),
  toggleUserBanStatus,
);
router.post(
  "/:id/resend-verification",
  isAuthenticated,
  authorize("admin"),
  validate(adminUserParamsSchema),
  resendVerificationEmail,
);
router.delete(
  "/:id/sessions/:sessionId",
  isAuthenticated,
  authorize("admin"),
  validate(adminSessionParamsSchema),
  revokeUserSession,
);

export default router;

