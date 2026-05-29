import { Router } from "express";
import {
  createStudyPlan,
  listStudyPlans,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  scrapeAndSaveStudyPlan,
} from "@/controllers/study-plan.controller";
import { isAuthenticated } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createStudyPlanSchema,
  updateStudyPlanSchema,
  getStudyPlanByIdSchema,
  deleteStudyPlanSchema,
  getStudyPlanListSchema,
} from "@/schemas/study-plan.schema";

const router = Router();

// Everyone authenticated can list or get details
router.get(
  "/",
  isAuthenticated,
  requirePermission("studyPlan", "read"),
  validate(getStudyPlanListSchema),
  listStudyPlans
);

router.get(
  "/:id",
  isAuthenticated,
  requirePermission("studyPlan", "read"),
  validate(getStudyPlanByIdSchema),
  getStudyPlanById
);

// Admin-only operations
router.post(
  "/",
  isAuthenticated,
  requirePermission("studyPlan", "create"),
  validate(createStudyPlanSchema),
  createStudyPlan
);

router.post(
  "/:id/scrape",
  isAuthenticated,
  requirePermission("studyPlan", "update"),
  validate(getStudyPlanByIdSchema),
  scrapeAndSaveStudyPlan
);

router.patch(
  "/:id",
  isAuthenticated,
  requirePermission("studyPlan", "update"),
  validate(updateStudyPlanSchema),
  updateStudyPlan
);

router.delete(
  "/:id",
  isAuthenticated,
  requirePermission("studyPlan", "delete"),
  validate(deleteStudyPlanSchema),
  deleteStudyPlan
);

export default router;
