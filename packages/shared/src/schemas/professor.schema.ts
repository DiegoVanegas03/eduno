import { z } from "zod";
import { mongoIdSchema } from "../constants/database.constants";

export const professorIdParamSchema = z.object({
  id: mongoIdSchema,
});

export type IProfessorIdParams = z.infer<typeof professorIdParamSchema>;

export const listProfessorsQuerySchema = z.object({
  search: z.string().optional(),
  areaCode: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).optional(),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1).max(100)).optional(),
});

export type IListProfessorsQuery = z.infer<typeof listProfessorsQuerySchema>;

export const verifyTeacherBodySchema = z.object({
  professorId: mongoIdSchema,
});

export type IVerifyTeacherBody = z.infer<typeof verifyTeacherBodySchema>;

export const createProfessorBodySchema = z.object({
  name: z.string().min(3, "El nombre del profesor debe tener al menos 3 caracteres"),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
  calificacion: z.number().min(0).max(5).optional(),
});

export type ICreateProfessorBody = z.infer<typeof createProfessorBodySchema>;

export const updateProfessorBodySchema = z.object({
  name: z.string().min(3, "El nombre del profesor debe tener al menos 3 caracteres").optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
  userId: mongoIdSchema.nullable().optional(),
  calificacion: z.number().min(0).max(5).optional(),
});

export type IUpdateProfessorBody = z.infer<typeof updateProfessorBodySchema>;
