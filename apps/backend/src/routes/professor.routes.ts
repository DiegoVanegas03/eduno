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
  getTrendingProfessors,
} from "@/controllers/professor.controller";
import {
  createReview,
  listReviewsByProfessor,
  likeReview,
  dislikeReview,
  deleteReview,
  updateReview,
} from "@/controllers/review.controller";
import {
  createReport,
  listReports,
  processReport,
} from "@/controllers/report.controller";
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

// Trending professors route (Must be defined before /:id)
router.get(
  "/trending",
  getTrendingProfessors
);

// Everyone authenticated can query/view professors
router.get(
  "/",
  validate(listProfessorsSchema),
  listProfessors
);

router.get(
  "/:id",
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

// --- Review Routes ---
router.post(
  "/:id/reviews",
  isAuthenticated,
  createReview
);

router.get(
  "/:id/reviews",
  listReviewsByProfessor
);

router.post(
  "/reviews/:reviewId/like",
  isAuthenticated,
  likeReview
);

router.post(
  "/reviews/:reviewId/dislike",
  isAuthenticated,
  dislikeReview
);

router.delete(
  "/reviews/:reviewId",
  isAuthenticated,
  deleteReview
);

router.put(
  "/reviews/:reviewId",
  isAuthenticated,
  updateReview
);

// --- Report Routes ---
router.post(
  "/reports/create",
  isAuthenticated,
  createReport
);

router.get(
  "/reports/list",
  isAuthenticated,
  requirePermission("user", "ban"),
  listReports
);

router.patch(
  "/reports/:id/process",
  isAuthenticated,
  requirePermission("user", "ban"),
  processReport
);

export default router;
