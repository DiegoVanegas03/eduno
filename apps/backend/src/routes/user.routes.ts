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
  getUserDashboardStats,
} from "@/controllers/user.controller";
import { isAuthenticated } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
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
  updateProfile,
);

router.patch(
  "/password",
  isAuthenticated,
  validate(updatePasswordSchema),
  updatePassword,
);

// DELETE /api/users/account — permanently removes the account after password verification
router.delete(
  "/account",
  isAuthenticated,
  validate(backendDeleteAccountSchema),
  deleteAccount,
);

// Admin-only & Moderator-only user profile / sessions / ban management (Permission-Based Access Control)
router.get(
  "/",
  isAuthenticated,
  requirePermission("user", "read"),
  getUsersForAdmin,
);
router.post(
  "/",
  isAuthenticated,
  requirePermission("user", "create"),
  validate(adminCreateUserSchema),
  createUserForAdmin,
);
router.patch(
  "/:id",
  isAuthenticated,
  requirePermission("user", "update"),
  validate(adminUpdateUserSchema),
  updateUserForAdmin,
);
router.delete(
  "/:id",
  isAuthenticated,
  requirePermission("user", "delete"),
  validate(adminUserParamsSchema),
  deleteUserForAdmin,
);

router.get(
  "/stats",
  isAuthenticated,
  requirePermission("user", "read"),
  getUserDashboardStats,
);

router.get(
  "/:id",
  isAuthenticated,
  requirePermission("user", "read"),
  requirePermission("session", "read"),
  validate(adminUserParamsSchema),
  getUserProfileForAdmin,
);
router.patch(
  "/:id/ban",
  isAuthenticated,
  requirePermission("user", "ban"),
  validate(adminUserParamsSchema),
  toggleUserBanStatus,
);
router.post(
  "/:id/resend-verification",
  isAuthenticated,
  requirePermission("user", "update"),
  validate(adminUserParamsSchema),
  resendVerificationEmail,
);
router.delete(
  "/:id/sessions/:sessionId",
  isAuthenticated,
  requirePermission("session", "delete"),
  validate(adminSessionParamsSchema),
  revokeUserSession,
);

export default router;
