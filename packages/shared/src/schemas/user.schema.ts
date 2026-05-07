import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Formato de email inválido").optional(),
  career: z.string().optional(),
  semester: z.string().optional(),
  description: z.string().max(500, "La descripción no puede superar los 500 caracteres").optional(),
  image: z.string().optional(), // Puede ser una URL o base64
}).refine((data) => Object.values(data).some((val) => val !== undefined), {
  message: "Debe proporcionar al menos un campo para actualizar",
});

export type IUpdateProfileDTO = z.infer<typeof updateProfileBodySchema>;
