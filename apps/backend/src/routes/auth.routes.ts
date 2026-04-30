import { Router } from "express";
import { getMe } from "@/controllers/auth.controller";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's profile.
 * All other auth endpoints (sign-in, sign-up, sign-out, OAuth callbacks, etc.)
 * are handled automatically by better-auth and mounted in app.ts.
 */
router.get("/me", protect, getMe);

export default router;
