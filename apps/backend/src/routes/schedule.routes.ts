import { Router } from "express";
import {
  scrapeAndSync,
  listSchedules,
  listPeriods,
} from "@/controllers/schedule.controller";

const router = Router();

router.post("/scrape", scrapeAndSync);
router.get("/", listSchedules);
router.get("/periods", listPeriods);

export default router;
