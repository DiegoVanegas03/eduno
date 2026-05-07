import { minioClient, BUCKETS } from "../config/minio";
import { getClamScanner } from "../config/clamav";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

/**
 * Sube una imagen en base64 a MinIO, previa validación de tipo y escaneo de virus.
 */
export const uploadBase64Image = async (base64String: string): Promise<string> => {
  // 1. Extraer el tipo y la data
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error("Formato de imagen base64 inválido");
  }

  const type = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  // 2. Validación de Tipo MIME (Seguridad básica)
  if (!type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen.");
  }

  // 3. Escaneo de Virus (ClamAV)
  const scanner = getClamScanner();
  if (scanner) {
    const stream = Readable.from(buffer);
    try {
      const { isInfected, viruses } = await scanner.scanStream(stream);
      if (isInfected) {
        console.error(`🚨 Virus detectado en subida de perfil: ${viruses.join(", ")}`);
        throw new Error("El archivo contiene una amenaza de seguridad y ha sido rechazado.");
      }
    } catch (scanError: any) {
      // Si ClamAV falla, decidimos si bloquear o dejar pasar. 
      // Por seguridad, aquí bloqueamos si el escáner está activo pero falla.
      console.error("❌ Error durante el escaneo de virus:", scanError);
      if (process.env.NODE_ENV === "production") {
        throw new Error("No se pudo verificar la seguridad del archivo.");
      }
    }
  }

  // 4. Subida a MinIO
  const extension = type.split("/")[1] || "png";
  const fileName = `${uuidv4()}.${extension}`;

  await minioClient.putObject(
    BUCKETS.PROFILES,
    fileName,
    buffer,
    buffer.length,
    { "Content-Type": type }
  );

  return `eduno:${fileName}`;
};
