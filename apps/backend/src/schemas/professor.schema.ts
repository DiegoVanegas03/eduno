import { z } from "zod";
import {
  professorIdParamSchema,
  listProfessorsQuerySchema,
  verifyTeacherBodySchema,
  createProfessorBodySchema,
  updateProfessorBodySchema,
} from "@eduno/shared";

export const getProfessorByIdSchema = z.object({
  params: professorIdParamSchema,
});

export const listProfessorsSchema = z.object({
  query: listProfessorsQuerySchema,
});

export const verifyTeacherSchema = z.object({
  body: verifyTeacherBodySchema,
});

export const createProfessorSchema = z.object({
  body: createProfessorBodySchema,
});

export const updateProfessorSchema = z.object({
  params: professorIdParamSchema,
  body: updateProfessorBodySchema,
});

export const deleteProfessorSchema = z.object({
  params: professorIdParamSchema,
});

// Professor Verification Requests validation schemas
import {
  createVerificationRequestSchema,
  approveVerificationRequestSchema,
  listVerificationRequestsQuerySchema,
} from "@eduno/shared";
import { mongoIdSchema } from "@eduno/shared";

export const createVerificationRequestBackendSchema = z.object({
  body: createVerificationRequestSchema,
});

export const approveVerificationRequestBackendSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: approveVerificationRequestSchema,
});

export const listVerificationRequestsBackendSchema = z.object({
  query: listVerificationRequestsQuerySchema,
});
