import { z } from "zod";
import {
  createCareerBodySchema,
  updateCareerBodySchema,
  listCareerQuerySchema,
  careerIdParamSchema,
} from "@eduno/shared";

export const getCareerByIdSchema = z.object({
  params: careerIdParamSchema,
});

export const createCareerSchema = z.object({
  body: createCareerBodySchema,
});

export const updateCareerSchema = z.object({
  params: careerIdParamSchema,
  body: updateCareerBodySchema,
});

export const deleteCareerSchema = z.object({
  params: careerIdParamSchema,
});

export const listCareerSchema = z.object({
  query: listCareerQuerySchema,
});
