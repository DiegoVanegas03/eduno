import { z } from 'zod';

export const scheduleSchema = z.object({
  courseCode: z.string().min(1, "El código de la materia es obligatorio"),
  courseName: z.string().min(1, "El nombre de la materia es obligatorio"),
  group: z.number({ message: "El grupo debe ser un número" }).int().positive(),
  type: z.string().min(1, "El tipo de curso es obligatorio"),
  timeBlock: z.string().min(1, "El horario es obligatorio"),
  days: z.array(z.number()).length(6, "Los días deben ser un arreglo de 6 elementos (valores binarios)"),
  professor: z.string().min(1, "El profesor es obligatorio"),
  building: z.string().min(1, "El edificio es obligatorio"),
  classroom: z.string().min(1, "El salón/aula es obligatorio"),
  occupancy: z.number().min(0).max(100, "El porcentaje de ocupación debe estar entre 0 y 100"),
  areaCode: z.number({ message: "El código de área es obligatorio" }).int(),
  period: z.string().min(1, "El periodo es obligatorio"),
});

export const scheduleQuerySchema = z.object({
  period: z.string().optional(),
  areaCode: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
  courseCode: z.string().optional(),
  professor: z.string().optional(),
  group: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
});

export type IScheduleDTO = z.infer<typeof scheduleSchema>;
export type IScheduleQueryDTO = z.infer<typeof scheduleQuerySchema>;
