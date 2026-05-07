import { z } from "zod";
import { updateProfileBodySchema } from "@eduno/shared";

export const updateProfileSchema = z.object({
  body: updateProfileBodySchema,
});
