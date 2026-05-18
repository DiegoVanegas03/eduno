import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.email("Formato de email inválido").optional(),
  career: z.string().optional(),
  semester: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

export type IUpdateProfileDTO = z.infer<typeof updateProfileBodySchema> & { image?: string };

export type IUpdatePasswordDTO = z.infer<typeof updateBodyPasswordSchema>;

export const updateBodyPasswordSchema = z.object({
    currentPassword: z.string().min(1,"La contraseña actual es requerida"),
    newPassword: z.string().min(1,"La nueva contraseña es requerida"),
    confirmPassword: z.string().min(1,"La confirmación de la contraseña es requerida"),
});
