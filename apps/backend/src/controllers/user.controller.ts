import { Request, Response } from "express";
import { auth } from "@/config/auth";
import { fromNodeHeaders } from "better-auth/node";
import {
  IUpdateProfileDTO,
  IApiResponse,
  IBetterAuthUser,
  IUpdatePasswordDTO,
} from "@eduno/shared";
import { uploadBufferToMinio, uploadBase64Image } from "@/utils/minio-upload";
import { asyncHandler } from "@/utils/async-handler";
import { logger } from "@/utils/logger";
import { UnauthorizedError } from "@/utils/app-error";

export const updateProfile = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IBetterAuthUser>>) => {
    const user = req.user;

    if(!user) throw new UnauthorizedError();

    const {
      name,
      email,
      career,
      semester,
      description,
      image,
    }: IUpdateProfileDTO = req.body;

    logger.debug(`[updateProfile] Body recibido para: ${email || user.email}`);

    let finalImage = image;
    if (req.file) {
      logger.info(
        `[updateProfile] Subiendo imagen a MinIO para usuario ${user.id} desde archivo adjunto...`,
      );
      finalImage = await uploadBufferToMinio(
        req.file.buffer,
        req.file.mimetype,
      );
      logger.debug(`[updateProfile] Imagen subida exitosamente`);
    } else if (image?.startsWith("data:image")) {
      logger.info(
        `[updateProfile] Subiendo imagen a MinIO para usuario ${user.id} desde base64...`,
      );
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
      logger.info(
        `[updateProfile] Solicitando cambio de email para usuario ${user.id}...`,
      );
      await auth.api.changeEmail({
        headers: fromNodeHeaders(req.headers),
        body: { newEmail: email },
      });
    }

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

export const updatePassword = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const user = req.user;

    if(!user) throw new UnauthorizedError();

    const { currentPassword, newPassword }: IUpdatePasswordDTO = req.body;

    logger.debug(
      `[updatePassword] Actualizando contraseña para: ${user.email}`,
    );

    await auth.api.changePassword({
      headers: fromNodeHeaders(req.headers),
      body: { currentPassword, newPassword, revokeOtherSessions: false },
    });

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  },
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const user = req.user;

    if(!user) throw new UnauthorizedError();

    
    const { password }: { password: string } = req.body;

    logger.info(`[deleteAccount] Eliminando cuenta para: ${user.email}`);

    try {
      await auth.api.signInEmail({
        body: { email: user.email, password },
        headers: fromNodeHeaders(req.headers),
      });
    } catch {
      logger.warn(`[deleteAccount] Contraseña incorrecta para: ${user.email}`);
      return res.status(401).json({
        success: false,
        error: "La contraseña es incorrecta. No se puede eliminar la cuenta.",
      });
    }

    await auth.api.deleteUser({
      headers: fromNodeHeaders(req.headers),
      body: { password },
    });

    logger.info(`[deleteAccount] Cuenta eliminada exitosamente: ${user.email}`);

    return res.json({
      success: true,
      message: "Tu cuenta ha sido eliminada correctamente.",
    });
  },
);
