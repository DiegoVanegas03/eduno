import { z } from "zod";
import {
  createScheduleBodySchema,
  updateScheduleBodySchema,
  scheduleQuerySchema,
  scheduleIdParamSchema,
} from "@eduno/shared";

export const getScheduleByIdSchema = z.object({
  params: scheduleIdParamSchema,
});

export const createScheduleSchema = z.object({
  body: createScheduleBodySchema,
});

export const updateScheduleSchema = z.object({
  params: scheduleIdParamSchema,
  body: updateScheduleBodySchema,
});

export const deleteScheduleSchema = z.object({
  params: scheduleIdParamSchema,
});

export const listSchedulesSchema = z.object({
  query: scheduleQuerySchema,
});
