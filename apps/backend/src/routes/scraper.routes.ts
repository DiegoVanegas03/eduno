import { Router } from "express";
import { getHorarios, getPlanEstudios } from "@/controllers/scraper.controller";

const router = Router();

router.get("/horarios", getHorarios);
router.get("/plan-estudios", getPlanEstudios);

export default router;
