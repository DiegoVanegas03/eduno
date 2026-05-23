import { z } from "zod";
import {
  updateProfileBodySchema,
  updateBodyPasswordSchema,
  deleteAccountSchema,
  createUserBodySchema,
  updateUserBodySchema,
  userParamsSchema,
  userSessionParamsSchema,
} from "@eduno/shared";
import { createMulterFileSchema } from "@/utils/zod.utils";

export const updateProfileSchema = z
  .object({
    body: updateProfileBodySchema,
    file: createMulterFileSchema({
      fieldname: "image",
      maxSizeMB: 5,
      acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    }).optional(),
  })
  .refine(
    (data) => {
      const hasBodyFields = Object.values(data.body).some(
        (val) => val !== undefined,
      );
      const hasFile = data.file !== undefined;
      return hasBodyFields || hasFile;
    },
    {
      message: "Debe proporcionar al menos un campo para actualizar",
      path: ["body"],
    },
  );

export const updatePasswordSchema = z.object({
  body: updateBodyPasswordSchema,
});

export const backendDeleteAccountSchema = z.object({
  body: deleteAccountSchema,
});

export const adminUserParamsSchema = z.object({
  params: userParamsSchema,
});

export const adminSessionParamsSchema = z.object({
  params: userSessionParamsSchema,
});

export const adminCreateUserSchema = z.object({
  body: createUserBodySchema,
});

export const adminUpdateUserSchema = z.object({
  params: userParamsSchema,
  body: updateUserBodySchema,
});
