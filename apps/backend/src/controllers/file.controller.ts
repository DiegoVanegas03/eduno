import { Request, Response } from "express";
import { Duplex } from "stream";
import zlib from "zlib";
import { minioClient, BUCKETS } from "../config/minio";
import { getClamScanner } from "../config/clamav";
import { FileModel } from "../models/file.model";

export const uploadFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se envió ningún archivo" });
      return;
    }

    const originalBuffer = req.file.buffer;
    const originalSize = req.file.size;

    console.log("🔍 Escaneando archivo original...");
    const clamscan = getClamScanner();
    if (!clamscan) {
      res.status(500).json({ error: "Servicio Antivirus no disponible" });
      return;
    }

    const stream = new Duplex();
    stream.push(originalBuffer);
    stream.push(null);

    const scanResult = await clamscan.scanStream(stream);
    console.log("Resultado ClamAV:", scanResult);

    if (scanResult.isInfected) {
      res.status(400).json({
        error: "🚨 Malware detectado. Archivo rechazado.",
        viruses: scanResult.viruses,
      });
      return;
    }

    console.log("✅ Archivo limpio. Comprimiendo...");
    // Comprimir el archivo original usando zlib
    const compressedBuffer = zlib.gzipSync(originalBuffer);
    const compressedSize = compressedBuffer.length;

    console.log(
      `📉 Compresión terminada: ${originalSize} bytes -> ${compressedSize} bytes`,
    );
    console.log("☁️ Subiendo archivo comprimido a MinIO...");

    // Guardar con extensión .gz
    const objectName = `${Date.now()}-${req.file.originalname}.gz`;

    await minioClient.putObject(
      BUCKETS.DOCUMENTS,
      objectName,
      compressedBuffer,
      compressedSize,
      {
        "Content-Type": "application/gzip",
        "Original-Content-Type": req.file.mimetype,
      },
    );

    // Registrar ambos tamaños si es necesario, pero guardaremos el tamaño comprimido en el modelo actual
    const newFileRecord = new FileModel({
      originalName: req.file.originalname,
      minioObjectName: objectName,
      size: compressedSize,
      mimetype: "application/gzip",
      isClean: true,
    });
    await newFileRecord.save();

    res.json({
      message: "Archivo subido, comprimido y verificado exitosamente",
      compressionRatio: `${((1 - compressedSize / originalSize) * 100).toFixed(2)}%`,
      file: newFileRecord,
    });
  } catch (error: any) {
    console.error("Error en uploadFile:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = await FileModel.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error obteniendo archivos", details: error.message });
  }
};
