import { z } from "zod";

interface MulterFileSchemaOptions {
  fieldname?: string;
  maxSizeMB?: number;
  acceptedMimeTypes?: string[];
}

/**
 * Genera un esquema de Zod para validar archivos subidos vía Multer.
 * Permite configurar el tamaño máximo y los tipos MIME aceptados.
 */
export const createMulterFileSchema = (options: MulterFileSchemaOptions = {}) => {
  const {
    fieldname,
    maxSizeMB = 5, // 5MB por defecto
    acceptedMimeTypes,
  } = options;

  let schema = z.object({
    fieldname: fieldname ? z.literal(fieldname) : z.string(),
    originalname: z.string().min(1),
    encoding: z.string(),
    mimetype: acceptedMimeTypes ? z.enum(acceptedMimeTypes as [string, ...string[]]) : z.string(),
    size: z.number().max(maxSizeMB * 1024 * 1024, `El archivo no debe pesar más de ${maxSizeMB}MB`),
    buffer: z.instanceof(Buffer),
  });

  return schema;
};
