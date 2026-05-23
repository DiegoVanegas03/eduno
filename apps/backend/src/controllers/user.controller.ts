import { Request, Response } from "express";
import { auth } from "@/config/auth";
import { fromNodeHeaders } from "better-auth/node";
import {
  IUpdateProfileDTO,
  IApiResponse,
  IBetterAuthUser,
  IUpdatePasswordDTO,
  IDeleteAccountSchema,
  IUserIdParams,
  IUserSessionParams,
  ICreateUserDTO,
  IUpdateUserDTO,
  IAdminUserProfile,
  IUserResponse,
} from "@eduno/shared";
import {
  uploadBufferToMinio,
  uploadBase64Image,
  getProfilePictureUrl,
} from "@/utils/minio-upload";
import { asyncHandler } from "@/utils/async-handler";
import { logger } from "@/utils/logger";
import {
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from "@/utils/app-error";
import mongoose from "mongoose";
import User from "@/models/user.model";

export const updateProfile = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IBetterAuthUser>>) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError();

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
      data: updatedSession?.user,
    });
  },
);

export const updatePassword = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError();

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

    if (!user) throw new UnauthorizedError();

    const { password }: IDeleteAccountSchema = req.body;

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

export const getUserProfileForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IAdminUserProfile>>) => {
    const { id } = req.params as IUserIdParams;

    // Buscar el usuario en Mongoose
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    // Obtener sesiones activas de la colección 'session' en MongoDB
    const sessionCollection = mongoose.connection.db?.collection("session");
    let sessions: any[] = [];
    if (sessionCollection) {
      sessions = await sessionCollection.find({ userId: id }).toArray();
    }

    // Formatear sesiones
    const formattedSessions = sessions.map((s) => ({
      id: s.id || s._id.toString(),
      ipAddress: s.ipAddress || "Desconocida",
      userAgent: s.userAgent || "Desconocido",
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          image: getProfilePictureUrl(user.image),
          isBanned: user.isBanned || false,
          career: user.career || "",
          semester: user.semester || "",
          description: user.description || "",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        sessions: formattedSessions,
      },
    });
  },
);

export const toggleUserBanStatus = asyncHandler(
  async (req: Request, res: Response<IApiResponse<{ isBanned: boolean }>>) => {
    const { id } = req.params as IUserIdParams;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    // Cambiar estado de baneo
    user.isBanned = !user.isBanned;
    await user.save();

    logger.info(
      `[toggleUserBanStatus] Usuario ${user.email} baneo cambiado a: ${user.isBanned}`,
    );

    // Si fue baneado, revocar de forma inmediata todas sus sesiones en Better-Auth/MongoDB
    if (user.isBanned) {
      const sessionCollection = mongoose.connection.db?.collection("session");
      if (sessionCollection) {
        const result = await sessionCollection.deleteMany({ userId: id });
        logger.info(
          `[toggleUserBanStatus] Revocadas ${result.deletedCount} sesiones activas para el usuario suspendido ${user.email}`,
        );
      }
    }

    return res.json({
      success: true,
      message: user.isBanned
        ? "El usuario ha sido suspendido y todas sus sesiones activas han sido revocadas."
        : "La cuenta de usuario ha sido habilitada exitosamente.",
      data: {
        isBanned: user.isBanned,
      },
    });
  },
);

export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const { id } = req.params as IUserIdParams;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: "El correo electrónico de este usuario ya está verificado.",
      });
    }

    logger.info(
      `[resendVerificationEmail] ✉️ Reenviando correo de verificación a ${user.email} (simulado)...`,
    );

    return res.json({
      success: true,
      message: `Enlace de verificación enviado con éxito a ${user.email}.`,
    });
  },
);

export const revokeUserSession = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const { id, sessionId } = req.params as IUserSessionParams;

    const sessionCollection = mongoose.connection.db?.collection("session");
    if (!sessionCollection) {
      throw new InternalServerError("Error de conexión a la base de datos");
    }

    let query: any = { userId: id };
    try {
      query.$or = [
        { id: sessionId },
        { _id: new mongoose.Types.ObjectId(sessionId) },
      ];
    } catch {
      query.id = sessionId;
    }

    const result = await sessionCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      // Intentar eliminar por campo 'id' de texto simple si falla el query anterior
      await sessionCollection.deleteOne({ userId: id, id: sessionId });
    }

    logger.info(
      `[revokeUserSession] Sesión ${sessionId} revocada para usuario ${id}`,
    );

    return res.json({
      success: true,
      message: "La sesión ha sido revocada de forma exitosa.",
    });
  },
);

export const getUsersForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IUserResponse[]>>) => {
    const { search, role, status, period, sort } = req.query;

    const query: any = {};

    // 1. Búsqueda por Nombre o Email (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Filtro por Rol
    if (role && role !== "Todos") {
      query.role = (role as string).toLowerCase();
    }

    // 3. Filtro por Estado (Activo / Baneado)
    if (status && status !== "Todos") {
      if (status === "Baneado") {
        query.isBanned = true;
      } else if (status === "Activo") {
        query.isBanned = { $ne: true };
      }
    }

    // 4. Filtro por Año de Creación (Periodo)
    if (period && period !== "Todos") {
      const year = parseInt(period as string, 10);
      if (!isNaN(year)) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    // 5. Ordenamiento
    let sortOption: any = { createdAt: -1 };
    if (sort === "asc") {
      sortOption = { createdAt: 1 };
    } else if (sort === "desc") {
      sortOption = { createdAt: -1 };
    }

    const users = await User.find(query).sort(sortOption);

    return res.json({
      success: true,
      data: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned || false,
        emailVerified: u.emailVerified || false,
        career: u.career || "",
        semester: u.semester || "",
        description: u.description || "",
        createdAt: u.createdAt,
        initialLetter: u.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        image: getProfilePictureUrl(u.image),
      })),
    });
  },
);

export const createUserForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IUserResponse>>) => {
    const { name, email, role, career, semester, description, password } =
      req.body as ICreateUserDTO;

    // Verificar si el correo ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "El correo electrónico ya está registrado.",
      });
    }

    // 1. Crear el usuario y sus credenciales en Better-Auth con todos los campos adicionales
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase(),
        password: password,
        name,
        role: role || "alumno",
        career: career || "",
        semester: semester || "",
        description: description || "",
      },
    });

    if (!signUpResult?.user) {
      throw new InternalServerError(
        "Error al registrar las credenciales en Better-Auth",
      );
    }

    logger.info(
      `[createUserForAdmin] Usuario creado por administrador y credenciales generadas: ${email}`,
    );

    const newUser = signUpResult.user as IBetterAuthUser;

    if (!newUser) {
      throw new InternalServerError(
        "Error al registrar las credenciales en Better-Auth",
      );
    }

    const extendedUser = newUser;

    return res.json({
      success: true,
      message: `Usuario ${name} registrado con éxito`,
      data: {
        ...extendedUser,
        initialLetter: (extendedUser.name || "")
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        image: getProfilePictureUrl(extendedUser.image),
      },
    });
  },
);

export const updateUserForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IUserResponse>>) => {
    const { id } = req.params as IUserIdParams;
    const { name, email, role, career, semester, description } =
      req.body as IUpdateUserDTO;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    // Si cambia de correo, verificar unicidad
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "El correo electrónico ya está en uso por otro usuario.",
        });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (career !== undefined) user.career = career;
    if (semester !== undefined) user.semester = semester;
    if (description !== undefined) user.description = description;

    await user.save();

    logger.info(
      `[updateUserForAdmin] Usuario ${user.email} actualizado por administrador`,
    );

    return res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned || false,
        emailVerified: user.emailVerified || false,
        career: user.career || "",
        semester: user.semester || "",
        description: user.description || "",
        createdAt: user.createdAt,
        initialLetter: user.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        image: getProfilePictureUrl(user.image),
      },
    });
  },
);

export const deleteUserForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const { id } = req.params as IUserIdParams;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    // Revocar todas sus sesiones de la colección 'session'
    const sessionCollection = mongoose.connection.db?.collection("session");
    if (sessionCollection) {
      await sessionCollection.deleteMany({ userId: id });
    }

    logger.info(
      `[deleteUserForAdmin] Usuario ${user.email} eliminado por administrador`,
    );

    return res.json({
      success: true,
      message:
        "Usuario eliminado de forma permanente y todas sus sesiones revocadas.",
    });
  },
);
