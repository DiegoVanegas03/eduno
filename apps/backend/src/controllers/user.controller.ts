import { Response } from "express";
import { auth } from "@/config/auth";
import { fromNodeHeaders } from "better-auth/node";
import {
  IUpdateProfileDTO,
  IApiResponse,
  IBetterAuthUser,
} from "@eduno/shared";
import { uploadBufferToMinio, uploadBase64Image } from "@/utils/minio-upload";
import { asyncHandler } from "@/utils/async-handler";
import { logger } from "@/utils/logger";

export const updateProfile = asyncHandler(
  async (req: any, res: Response<IApiResponse<IBetterAuthUser>>) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, error: "No autorizado" });
    }

    const {
      name,
      email,
      career,
      semester,
      description,
      image,
    }: IUpdateProfileDTO = req.body;

    logger.debug(`[updateProfile] Body recibido para: ${email || user.email}`);

    // 1. Si la imagen viene como archivo (multipart/form-data)
    let finalImage = image;
    if (req.file) {
      logger.info(`[updateProfile] Subiendo imagen a MinIO para usuario ${user.id} desde archivo adjunto...`);
      finalImage = await uploadBufferToMinio(req.file.buffer, req.file.mimetype);
      logger.debug(`[updateProfile] Imagen subida exitosamente`);
    } else if (image?.startsWith("data:image")) {
      logger.info(`[updateProfile] Subiendo imagen a MinIO para usuario ${user.id} desde base64...`);
      finalImage = await uploadBase64Image(image);
      logger.debug(`[updateProfile] Imagen subida exitosamente`);
    }

    // 2. Actualizar campos de perfil generales
    logger.info(`[updateProfile] Actualizando perfil de usuario ${user.id}...`);
    await auth.api.updateUser({
      headers: fromNodeHeaders(req.headers),
      body: { name, image: finalImage, career, semester, description },
    });

    // 3. Si el email cambió, solicitar cambio por Better Auth
    if (email && email !== user.email) {
      logger.info(`[updateProfile] Solicitando cambio de email para usuario ${user.id}...`);
      await auth.api.changeEmail({
        headers: fromNodeHeaders(req.headers),
        body: { newEmail: email },
      });
    }

    // 4. Recuperar sesión actualizada para devolverla al frontend
    const updatedSession = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    return res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: updatedSession?.user as IBetterAuthUser,
    });
  },
);
