import { Request, Response } from "express";
import { Duplex, Readable } from "stream";
import zlib from "zlib"; // Suggested for compression if desired in the future
import mongoose from "mongoose";
import { minioClient, BUCKETS } from "../config/minio";
import { getClamScanner } from "../config/clamav";
import { FileModel } from "../models/file.model";
import UserDownload from "../models/user-download.model";
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError } from "../utils/app-error";
import { logger } from "../utils/logger";

/**
 * Format file documents into a clean DTO containing a string "id".
 * Resolves the "undefined" path ID cast error during student deletions.
 */
const formatFileResponse = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id ? obj._id.toString() : obj.id,
    originalName: obj.originalName,
    minioObjectName: obj.minioObjectName,
    size: obj.size,
    mimetype: obj.mimetype,
    isClean: obj.isClean,
    uploaderId: obj.uploaderId,
    materiaId: obj.materiaId,
    status: obj.status,
    uploadedAt: obj.uploadedAt,
  };
};

/**
 * Upload a new file (note) contributed by a student.
 * Scans with ClamAV, then uploads directly to "archivos" bucket in MinIO.
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para subir un archivo.");
    }

    if (!req.file) {
      throw new BadRequestError("No se envió ningún archivo.");
    }

    const { materiaId } = req.body;
    if (!materiaId) {
      throw new BadRequestError("El ID de la materia es obligatorio.");
    }

    const originalBuffer = req.file.buffer;
    const originalSize = req.file.size;

    logger.info(`[uploadFile] Escaneando archivo original "${req.file.originalname}"...`);
    const clamscan = getClamScanner();
    if (!clamscan) {
      throw new BadRequestError("Servicio Antivirus no disponible.");
    }

    const stream = Readable.from(originalBuffer);
    const scanResult = await clamscan.scanStream(stream);

    if (scanResult.isInfected) {
      logger.warn(`🚨 Virus detectado en archivo subido por el usuario ${user.id}: ${scanResult.viruses.join(", ")}`);
      throw new BadRequestError("Amenaza detectada. Archivo rechazado por seguridad.");
    }

    logger.info("✅ Archivo limpio. Subiendo a MinIO (bucket: archivos)...");

    // Unique filename saved inside "archivos" bucket (no compression is performed, standard direct upload)
    const fileId = new mongoose.Types.ObjectId();
    const extension = req.file.originalname.split(".").pop() || "";
    const objectName = `${fileId}-${Date.now()}.${extension}`;

    // SUGGESTION: Compression could be synchronous e.g. zlib.gzipSync(originalBuffer)
    // but as requested we keep it uncompressed for simplicity and direct accessibility.
    await minioClient.putObject(
      BUCKETS.ARCHIVOS,
      objectName,
      originalBuffer,
      originalSize,
      {
        "Content-Type": req.file.mimetype,
      }
    );

    // Save record to DB with "eduno:" prefix
    const newFileRecord = new FileModel({
      _id: fileId,
      originalName: req.file.originalname,
      minioObjectName: `eduno:${objectName}`,
      size: originalSize,
      mimetype: req.file.mimetype,
      isClean: true,
      uploaderId: user.id,
      materiaId,
      status: "pending",
    });

    await newFileRecord.save();

    res.status(201).json({
      success: true,
      message: "Archivo subido exitosamente. Entrará en proceso de moderación.",
      data: formatFileResponse(newFileRecord),
    });
  } catch (error: any) {
    logger.error("Error en uploadFile:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Error interno del servidor",
    });
  }
};

/**
 * Download a file. Validates downloads quota and streams file directly.
 */
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para descargar un archivo.");
    }

    const { id } = req.params;
    const file = await FileModel.findById(id);
    if (!file) {
      throw new NotFoundError("Archivo no encontrado.");
    }

    const isUploaderOrAdmin =
      file.uploaderId.toString() === user.id || ["admin", "moderador"].includes(user.role);

    // Quota validation for regular students downloading other people's files
    if (!isUploaderOrAdmin) {
      if (file.status !== "approved") {
        throw new ForbiddenError("No puedes descargar un archivo que no ha sido aprobado por moderación.");
      }

      // 1. Calculate allowance
      const approvedCount = await FileModel.countDocuments({ uploaderId: user.id, status: "approved" });
      const allowance = approvedCount * 5;

      // 2. Check if already downloaded by this user
      const alreadyDownloaded = await UserDownload.findOne({ userId: user.id, fileId: id });
      if (!alreadyDownloaded) {
        // 3. Count unique consumed downloads
        const consumedCount = await UserDownload.countDocuments({ userId: user.id });
        if (consumedCount >= allowance) {
          throw new ForbiddenError(
            "Has superado tu límite de descargas. Sube apuntes valiosos y, cuando sean aprobados, ganarás 5 descargas más por cada uno."
          );
        }

        // Record download
        await UserDownload.create({ userId: user.id, fileId: id });
      }
    }

    // Direct stream from MinIO without gzip/gunzip compression layers
    const objectNameNoPrefix = file.minioObjectName.startsWith("eduno:")
      ? file.minioObjectName.split(":")[1]
      : file.minioObjectName;

    logger.info(`[downloadFile] Descargando objeto "${objectNameNoPrefix}" de MinIO...`);
    const dataStream = await minioClient.getObject(BUCKETS.ARCHIVOS, objectNameNoPrefix);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader("Content-Type", file.mimetype);

    // SUGGESTION: If files were compressed with gzip, we would pipe it like:
    // const gunzip = zlib.createGunzip();
    // dataStream.pipe(gunzip).pipe(res);
    dataStream.pipe(res);
  } catch (error: any) {
    logger.error("Error en downloadFile:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Error al descargar el archivo",
    });
  }
};

/**
 * List files uploaded by the authenticated student.
 */
export const getMyUploads = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const files = await FileModel.find({ uploaderId: user.id }).sort({ uploadedAt: -1 });
    res.json({
      success: true,
      data: files.map(formatFileResponse),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a student's own upload.
 */
export const deleteMyUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const { id } = req.params;
    const file = await FileModel.findById(id);
    if (!file) {
      throw new NotFoundError("Archivo no encontrado.");
    }

    if (file.uploaderId.toString() !== user.id && user.role !== "admin") {
      throw new ForbiddenError("No tienes permiso para eliminar este archivo.");
    }

    const objectNameNoPrefix = file.minioObjectName.startsWith("eduno:")
      ? file.minioObjectName.split(":")[1]
      : file.minioObjectName;

    logger.info(`[deleteMyUpload] Borrando objeto "${objectNameNoPrefix}" de MinIO...`);
    try {
      await minioClient.removeObject(BUCKETS.ARCHIVOS, objectNameNoPrefix);
    } catch (minioErr) {
      logger.warn(`No se pudo borrar el archivo de MinIO, procediendo a borrar de DB:`, minioErr);
    }

    await FileModel.findByIdAndDelete(id);
    res.json({
      success: true,
      message: "Archivo eliminado correctamente.",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * List all files in pending state for moderation (Admin only).
 */
export const listPendingFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = await FileModel.find({ status: "pending" })
      .populate("uploaderId", "name email")
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: files.map(formatFileResponse),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Moderate a file (approve or reject) (Admin only).
 */
export const moderateFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw new BadRequestError("El estado debe ser 'approved' o 'rejected'.");
    }

    const file = await FileModel.findById(id);
    if (!file) {
      throw new NotFoundError("Archivo no encontrado.");
    }

    file.status = status;
    await file.save();

    res.json({
      success: true,
      message: `Archivo marcado como ${status === "approved" ? "aprobado" : "rechazado"} exitosamente.`,
      data: formatFileResponse(file),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
