import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { scrapeHorarios } from "@/utils/scraper";
import { scrapePlanEstudios, scrapeAllPlans } from "@/utils/plan-estudios";

export const getHorarios = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await scrapeHorarios();
    res.json(data);
  },
);

export const getPlanEstudios = asyncHandler(
  async (req: Request, res: Response) => {
    const { carrera } = req.query;

    const PLANS: Record<string, { carrera: string; url: string }> = {
      si: {
        carrera: "Sistemas Inteligentes",
        url: "https://infocomp.ingenieria.uaslp.mx/cominf/public/principal/sistemasinteligentes/pe",
      },
      ic: {
        carrera: "Ingeniería en Computación",
        url: "https://infocomp.ingenieria.uaslp.mx/cominf/public/principal/icomputacion/pe",
      },
    };

    if (carrera && typeof carrera === "string" && PLANS[carrera]) {
      const plan = PLANS[carrera];
      const data = await scrapePlanEstudios(plan.url, plan.carrera);
      res.json(data);
    } else {
      const data = await scrapeAllPlans();
      res.json(data);
    }
  },
);
