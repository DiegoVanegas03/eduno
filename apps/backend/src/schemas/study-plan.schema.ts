import { z } from "zod";
import {
  createStudyPlanBodySchema,
  updateStudyPlanBodySchema,
  studyPlanIdParamSchema,
  getStudyPlanListQuerySchema,
} from "@eduno/shared";

export const getStudyPlanByIdSchema = z.object({
  params: studyPlanIdParamSchema,
});

export const getStudyPlanListSchema = z.object({
  query: getStudyPlanListQuerySchema,
});

export const createStudyPlanSchema = z.object({
  body: createStudyPlanBodySchema,
});

export const updateStudyPlanSchema = z.object({
  params: studyPlanIdParamSchema,
  body: updateStudyPlanBodySchema,
});

export const deleteStudyPlanSchema = z.object({
  params: studyPlanIdParamSchema,
});
