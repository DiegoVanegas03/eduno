import { z } from "zod";
import { rolesTuple } from "../constants/roles.constants";

export const updateProfileBodySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
  email: z.email("Formato de email inválido").optional(),
  career: z.string().optional(),
  semester: z.string().optional(),
  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
});

export type IUpdateProfileDTO = z.infer<typeof updateProfileBodySchema> & {
  image?: string;
};

export const updateUserBodySchema = updateProfileBodySchema.merge(
  z.object({
    role: z.enum(rolesTuple).optional(),
  }),
);

export type IUpdateUserDTO = z.infer<typeof updateUserBodySchema>;

export type IUpdatePasswordDTO = z.infer<typeof updateBodyPasswordSchema>;

export const updateBodyPasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "La confirmación de la contraseña es requerida"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, "La contraseña es requerida para confirmar la eliminación"),
});

export type IDeleteAccountSchema = z.infer<typeof deleteAccountSchema>;

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "ID inválido");

export const userParamsSchema = z.object({
  id: mongoIdSchema,
});

export type IUserIdParams = z.infer<typeof userParamsSchema>;

export const userSessionParamsSchema = z.object({
  id: mongoIdSchema,
  sessionId: z.string().min(1, "El ID de sesión es requerido"),
});

export type IUserSessionParams = z.infer<typeof userSessionParamsSchema>;

export const createUserBodySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Formato de email inválido"),
  role: z.enum(rolesTuple).optional(),
  career: z.string().optional(),
  semester: z.string().optional(),
  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
  password: z.string(),
});

export type ICreateUserDTO = z.infer<typeof createUserBodySchema>;
