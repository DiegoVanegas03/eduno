import { Router } from "express";
import multer from "multer";
import { uploadFile, getFiles } from "../controllers/file.controller";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("documento"), uploadFile);
router.get("/", getFiles);

export default router;
