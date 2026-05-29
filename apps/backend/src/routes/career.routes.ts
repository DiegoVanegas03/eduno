import { Router } from "express";
import {
  createCareer,
  listCareers,
  getCareerById,
  updateCareer,
  deleteCareer,
} from "@/controllers/career.controller";
import { isAuthenticated } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createCareerSchema,
  updateCareerSchema,
  getCareerByIdSchema,
  deleteCareerSchema,
  listCareerSchema,
} from "@/schemas/career.schema";

const router = Router();

// Everyone authenticated can list or get details
router.get(
  "/",
  isAuthenticated,
  validate(listCareerSchema),
  requirePermission("career", "read"),
  listCareers
);

router.get(
  "/:id",
  isAuthenticated,
  requirePermission("career", "read"),
  validate(getCareerByIdSchema),
  getCareerById
);

// Admin-only operations
router.post(
  "/",
  isAuthenticated,
  requirePermission("career", "create"),
  validate(createCareerSchema),
  createCareer
);

router.patch(
  "/:id",
  isAuthenticated,
  requirePermission("career", "update"),
  validate(updateCareerSchema),
  updateCareer
);

router.delete(
  "/:id",
  isAuthenticated,
  requirePermission("career", "delete"),
  validate(deleteCareerSchema),
  deleteCareer
);

export default router;
