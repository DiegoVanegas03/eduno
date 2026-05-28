import { Router } from "express";
import multer from "multer";
import {
  uploadFile,
  downloadFile,
  getMyUploads,
  deleteMyUpload,
  listPendingFiles,
  moderateFile,
} from "@/controllers/file.controller";
import { isAuthenticated, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { uploadFileSchema } from "@/schemas/file.schema";
import { USER_ROLES } from "@eduno/shared";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Student contribution & management
router.post(
  "/upload",
  isAuthenticated,
  upload.single("documento"),
  validate(uploadFileSchema),
  uploadFile
);

router.get("/my-uploads", isAuthenticated, getMyUploads);
router.delete("/:id", isAuthenticated, deleteMyUpload);

// Secure downloads with quota validations
router.get("/:id/download", isAuthenticated, downloadFile);

// Admin / Moderator controls
router.get(
  "/pending",
  isAuthenticated,
  authorize("admin", "moderador"),
  listPendingFiles
);

router.post(
  "/:id/moderate",
  isAuthenticated,
  authorize("admin", "moderador"),
  moderateFile
);

export default router;
