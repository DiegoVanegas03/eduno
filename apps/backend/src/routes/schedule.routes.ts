import { Router } from "express";
import {
  scrapeAndSync,
  listSchedules,
  listPeriods,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/controllers/schedule.controller";
import { isAuthenticated } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  listSchedulesSchema,
  createScheduleSchema,
  updateScheduleSchema,
  deleteScheduleSchema,
} from "@/schemas/schedule.schema";

const router = Router();

// Retrieve periods or search schedules (Anyone authenticated can read)
router.get(
  "/",
  isAuthenticated,
  requirePermission("schedule", "read"),
  validate(listSchedulesSchema),
  listSchedules
);

router.get(
  "/periods",
  isAuthenticated,
  requirePermission("schedule", "read"),
  listPeriods
);

// Admin-only write operations
router.post(
  "/",
  isAuthenticated,
  requirePermission("schedule", "create"),
  validate(createScheduleSchema),
  createSchedule
);

router.post(
  "/scrape",
  isAuthenticated,
  requirePermission("schedule", "create"),
  requirePermission("schedule", "scraper"),
  scrapeAndSync
);

router.patch(
  "/:id",
  isAuthenticated,
  requirePermission("schedule", "update"),
  validate(updateScheduleSchema),
  updateSchedule
);

router.delete(
  "/:id",
  isAuthenticated,
  requirePermission("schedule", "delete"),
  validate(deleteScheduleSchema),
  deleteSchedule
);

export default router;
