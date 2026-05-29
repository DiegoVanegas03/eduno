import { z } from "zod";
import { mongoIdSchema } from "../constants/database.constants";

export const studyPlanSchema = z.object({
  name: z.string().min(2, "El nombre del plan de estudio debe tener al menos 2 caracteres"),
  career: mongoIdSchema,
  isActive: z.boolean().default(true),
  isLatest: z.boolean().default(false),
  url: z.string().url("Formato de URL inválido").optional().or(z.literal("")),
  structure: z.any().optional(),
});

export const studyPlanIdParamSchema = z.object({
  id: mongoIdSchema,
});

export const getStudyPlanListQuerySchema = z.object({
  career: mongoIdSchema,
  isActive: z.preprocess(
    (val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    },
    z.boolean().default(true)
  ).optional(),
});
export type IGetStudyPlanListQuery = z.infer<typeof getStudyPlanListQuerySchema>;

export const createStudyPlanBodySchema = studyPlanSchema;
export const updateStudyPlanBodySchema = studyPlanSchema.partial();


export type ICreateStudyPlanSchema = z.infer<typeof createStudyPlanBodySchema>;
export type IUpdateStudyPlanSchema = z.infer<typeof updateStudyPlanBodySchema>;
