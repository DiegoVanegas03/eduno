import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Formato de email inválido").optional(),
  career: z.string().optional(),
  semester: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres").optional(),
});

export type IUpdateProfileDTO = z.infer<typeof updateProfileBodySchema> & { image?: string };
