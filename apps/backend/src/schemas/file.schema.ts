import { z } from "zod";
import { createMulterFileSchema } from "@/utils/zod.utils";

export const uploadFileSchema = z.object({
  body: z.object({
    materiaId: z.string().min(1, "El ID de la materia es obligatorio"),
  }),
  file: createMulterFileSchema({
    fieldname: "documento",
    maxSizeMB: 20, // Allowing up to 20MB for notes
    acceptedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
  }),
});
