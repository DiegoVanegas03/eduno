import { z } from "zod";
import { mongoIdSchema } from "../constants/database.constants";

export const createVerificationRequestSchema = z.object({
  professorId: mongoIdSchema,
});

export type ICreateVerificationRequest = z.infer<typeof createVerificationRequestSchema>;

export const approveVerificationRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(500, "Las notas de revisión no deben superar los 500 caracteres").optional(),
});

export type IApproveVerificationRequest = z.infer<typeof approveVerificationRequestSchema>;

export const listVerificationRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).optional(),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1).max(100)).optional(),
});

export type IListVerificationRequestsQuery = z.infer<typeof listVerificationRequestsQuerySchema>;
