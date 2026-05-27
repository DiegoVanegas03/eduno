import { Router } from "express";
import {
  listProfessors,
  getProfessorById,
  requestTeacherVerification,
  createProfessor,
  updateProfessor,
  deleteProfessor,
  listVerificationRequests,
  processVerificationRequest,
} from "@/controllers/professor.controller";
import { isAuthenticated } from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/permission.middleware";
import { validate } from "@/middleware/validate.middleware";
import multer from "multer";
import {
  listProfessorsSchema,
  getProfessorByIdSchema,
  createProfessorSchema,
  updateProfessorSchema,
  deleteProfessorSchema,
  createVerificationRequestBackendSchema,
  approveVerificationRequestBackendSchema,
  listVerificationRequestsBackendSchema,
} from "@/schemas/professor.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Everyone authenticated can query/view professors
router.get(
  "/",
  isAuthenticated,
  validate(listProfessorsSchema),
  listProfessors
);

router.get(
  "/:id",
  isAuthenticated,
  validate(getProfessorByIdSchema),
  getProfessorById
);

// Authenticated users can request changing/elevating role to professor with pay stub/comprobante upload
router.post(
  "/verify-request",
  isAuthenticated,
  upload.single("documento"),
  validate(createVerificationRequestBackendSchema),
  requestTeacherVerification
);

// Administrative routes for reviewing teacher requests
router.get(
  "/verification-requests/list",
  isAuthenticated,
  requirePermission("user", "ban"),
  validate(listVerificationRequestsBackendSchema),
  listVerificationRequests
);

router.patch(
  "/verification-requests/:id/process",
  isAuthenticated,
  requirePermission("user", "ban"),
  validate(approveVerificationRequestBackendSchema),
  processVerificationRequest
);

// Admin-only CRUD actions
router.post(
  "/",
  isAuthenticated,
  requirePermission("career", "create"),
  validate(createProfessorSchema),
  createProfessor
);

router.patch(
  "/:id",
  isAuthenticated,
  requirePermission("career", "update"),
  validate(updateProfessorSchema),
  updateProfessor
);

router.delete(
  "/:id",
  isAuthenticated,
  requirePermission("career", "delete"),
  validate(deleteProfessorSchema),
  deleteProfessor
);

export default router;
