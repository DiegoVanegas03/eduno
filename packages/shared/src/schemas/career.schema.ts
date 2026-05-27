import { z } from "zod";
import { mongoIdSchema } from "../constants/database.constants";

export const careerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre de la carrera debe tener al menos 2 caracteres"),
  areaCode: z
    .number()
    .min(0, "El código de área debe ser mayor o igual a 0")
    .max(8, "El código de área debe ser menor o igual a 8")
    .optional(),
  semesters: z.number().min(1, "La carrera debe tener al menos 1 semestre"),
  isActive: z.boolean().default(true),
});

export const createCareerBodySchema = careerSchema;
export const updateCareerBodySchema = careerSchema.partial();

export const listCareerQuerySchema = careerSchema
  .pick({
    areaCode: true,
    isActive: true,
  })
  .partial();

export const careerIdParamSchema = z.object({
  id: mongoIdSchema,
});

export type ICareerIdParamSchema = z.infer<typeof careerIdParamSchema>;

export type ICarrerListQuerySchema = z.infer<typeof listCareerQuerySchema>;

export type ICreateCareerSchema = z.infer<typeof createCareerBodySchema>;
export type IUpdateCareerSchema = z.infer<typeof updateCareerBodySchema>;
