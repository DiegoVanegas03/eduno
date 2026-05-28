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
  IUserDashboardStats,
  getInitialLetter,
  IBetterAuthSession,
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
  BadRequestError,
  AppError,
} from "@/utils/app-error";
import mongoose from "mongoose";
import User from "@/models/user.model";
import { FileModel } from "@/models/file.model";
import UserDownload from "@/models/user-download.model";

export const updateProfile = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, IUpdateProfileDTO>,
    res: Response<IApiResponse<IBetterAuthUser>>,
  ) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError();

    const { name, email, career, semester, description, image } = req.body;

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
  async (
    req: Request<Record<string, string>, unknown, IUpdatePasswordDTO>,
    res: Response<IApiResponse<void>>,
  ) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError();

    const { currentPassword, newPassword } = req.body;

    logger.debug(
      `[updatePassword] Evaluando y actualizando contraseña para: ${user.email}`,
    );

    // 1. Determinar si el usuario tiene una contraseña configurada buscando su cuenta "credential" en la colección "account"
    const accountCollection = mongoose.connection.db?.collection("account");
    let hasPassword = false;
    if (accountCollection) {
      const credentialAccount = await accountCollection.findOne({
        userId: new mongoose.Types.ObjectId(user.id),
        providerId: "credential",
      });

      hasPassword = !!credentialAccount;
    }

    // 2. Ejecutar la actualización según el caso
    try {
      if (hasPassword) {
        // Cuenta con contraseña preexistente -> Requiere contraseña actual para cambiarla
        if (!currentPassword) {
          throw new BadRequestError(
            "La contraseña actual es requerida para realizar el cambio.",
          );
        }

        await auth.api.changePassword({
          headers: fromNodeHeaders(req.headers),
          body: { currentPassword, newPassword, revokeOtherSessions: false },
        });
      } else {
        // Cuenta creada por OAuth (Google/Microsoft) sin contraseña -> Establece la contraseña por primera vez
        await auth.api.setPassword({
          headers: fromNodeHeaders(req.headers),
          body: { newPassword },
        });
      }
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      logger.warn(
        `[updatePassword] Error al actualizar la contraseña para ${user.email}: ${error.message}`,
      );

      // Si ya es un AppError (como el BadRequestError de arriba), volverlo a lanzar directamente
      if (err instanceof AppError) {
        throw err;
      }

      // Mapear errores de Better Auth o retornar un mensaje amigable
      const errorMsg =
        error.message === "INVALID_PASSWORD" || error.status === 400
          ? "La contraseña actual es incorrecta o no cumple con los requisitos de Better Auth."
          : error.message ||
            "Error al procesar la actualización de la contraseña.";

      throw new BadRequestError(errorMsg);
    }

    return res.json({
      success: true,
      message: hasPassword
        ? "Contraseña actualizada correctamente"
        : "Contraseña establecida con éxito para tu cuenta",
    });
  },
);

export const deleteAccount = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, IDeleteAccountSchema>,
    res: Response<IApiResponse<void>>,
  ) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError();

    const { password } = req.body;

    try {
      await auth.api.deleteUser({
        headers: fromNodeHeaders(req.headers),
        body: { password },
      });
    } catch (err) {
      logger.warn(`[deleteAccount] Error al eliminar la cuenta de ${user.email}:`, err);
      if (err && typeof err === "object") {
        const errorObj = err as Record<string, unknown>;
        const status = errorObj.status;
        const message = typeof errorObj.message === "string" ? errorObj.message : "";
        const code = typeof errorObj.code === "string" ? errorObj.code : "";
        if (
          status === 401 ||
          status === 400 ||
          message.toLowerCase().includes("password") ||
          message.toLowerCase().includes("credential") ||
          code.includes("INVALID")
        ) {
          throw new BadRequestError("La contraseña proporcionada es incorrecta.");
        }
      }
      throw err;
    }

    logger.info(`[deleteAccount] Cuenta eliminada exitosamente: ${user.email}`);

    return res.json({
      success: true,
      message: "Tu cuenta ha sido eliminada correctamente.",
    });
  },
);

export const getMySessions = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IBetterAuthSession[]>>) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();

    const sessionResult = await auth.api.listUserSessions({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId: user.id,
      },
    });
    const rawSessions = sessionResult?.sessions || [];
    const sessions: IBetterAuthSession[] = rawSessions.map((s) => ({
      id: s.id,
      token: s.token,
      userId: s.userId,
      expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : String(s.expiresAt),
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
      updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
      ipAddress: s.ipAddress ?? undefined,
      userAgent: s.userAgent ?? undefined,
    }));

    return res.json({
      success: true,
      data: sessions,
    });
  },
);

export const revokeMySession = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();

    const { sessionId } = req.params;

    // Verify first that this session belongs to the logged-in user
    const sessionResult = await auth.api.listUserSessions({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId: user.id,
      },
    });
    const sessions = sessionResult?.sessions || [];
    const matchedSession = sessions.find((s) => s.token === sessionId || s.id === sessionId);

    if (!matchedSession) {
      throw new NotFoundError("Sesión no encontrada o no pertenece a tu cuenta.");
    }

    await auth.api.revokeUserSession({
      headers: fromNodeHeaders(req.headers),
      body: {
        sessionToken: matchedSession.token,
      },
    });

    logger.info(`[revokeMySession] Sesión revocada por el usuario: ${user.email}`);

    return res.json({
      success: true,
      message: "La sesión ha sido revocada de forma exitosa.",
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

    // Obtener sesiones activas a través de Better Auth Admin API
    const sessionResult = await auth.api.listUserSessions({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId: id,
      },
    });
    const sessions = sessionResult?.sessions || [];

    const now = new Date().getTime();

    // Formatear sesiones (usando s.token como ID en la UI para revocar sin alterar la firma del REST)
    const formattedSessions = sessions
      .map((s) => ({
        id: s.token,
        ipAddress: s.ipAddress || "Desconocida",
        userAgent: s.userAgent || "Desconocido",
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isExpired: new Date(s.expiresAt).getTime() < now,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          initialLetter: getInitialLetter(user.name),
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

    // Cambiar estado de baneo en Better Auth Admin API
    if (user.isBanned) {
      // Habilitar acceso de nuevo
      await auth.api.unbanUser({
        headers: fromNodeHeaders(req.headers),
        body: {
          userId: id,
        },
      });
      user.isBanned = false;
    } else {
      // Suspender acceso y revocar de forma inmediata todas sus sesiones
      await auth.api.banUser({
        headers: fromNodeHeaders(req.headers),
        body: {
          userId: id,
        },
      });
      user.isBanned = true;
    }

    await user.save();

    logger.info(
      `[toggleUserBanStatus] Usuario ${user.email} baneo cambiado a: ${user.isBanned}`,
    );

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

    // sessionId en la URL contiene el sessionToken que enviamos desde getUserProfileForAdmin
    await auth.api.revokeUserSession({
      headers: fromNodeHeaders(req.headers),
      body: {
        sessionToken: sessionId,
      },
    });

    logger.info(
      `[revokeUserSession] Sesión revocada con token para el usuario ${id}`,
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

    const query: mongoose.FilterQuery<Record<string, unknown>> = {};

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
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
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
        initialLetter: getInitialLetter(u.name),
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

    // 1. Crear el usuario y sus credenciales en Better-Auth con todos los campos adicionales usando la API administrativa
    const signUpResult = await auth.api.createUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        email: email.toLowerCase(),
        password: password,
        name,
        role: role || "alumno",
        data: {
          career: career || "",
          semester: semester || "",
          description: description || "",
        },
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

    // Ensure no active session is generated for the new user upon administrative creation
    const sessionCollection = mongoose.connection.db?.collection("session");
    if (sessionCollection) {
      await sessionCollection.deleteMany({ userId: newUser.id });
      logger.info(
        `[createUserForAdmin] Sesiones de autologin eliminadas preventivamente para: ${email}`,
      );
    }

    const extendedUser = newUser;

    return res.json({
      success: true,
      message: `Usuario ${name} registrado con éxito`,
      data: {
        ...extendedUser,
        initialLetter: getInitialLetter(extendedUser.name),
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
        initialLetter: getInitialLetter(user.name),
        image: getProfilePictureUrl(user.image),
      },
    });
  },
);

export const deleteUserForAdmin = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const { id } = req.params as IUserIdParams;

    // Eliminar credenciales y sesiones asociadas de Better-Auth
    await auth.api.removeUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId: id,
      },
    });

    // Asegurar eliminación del documento en Mongoose
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
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

export const getUserDashboardStats = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IUserDashboardStats>>) => {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const profesoresCount = await User.countDocuments({ role: "profesor" });

    // Active Users from session collection (non-expired)
    const sessionCollection = mongoose.connection.db?.collection("session");
    const activeSessions = sessionCollection
      ? await sessionCollection
          .find({ expiresAt: { $gt: new Date() } })
          .toArray()
      : [];
    const uniqueActiveUserIds = new Set(
      activeSessions.map((s) => s.userId.toString()),
    );
    const activeUsers = uniqueActiveUserIds.size;

    // Monthly growth (Month to Date compared to same day last month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const sameTimePreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );

    const currentMonthCount = await User.countDocuments({
      createdAt: { $gte: startOfCurrentMonth, $lte: now },
    });

    const previousMonthCount = await User.countDocuments({
      createdAt: { $gte: startOfPreviousMonth, $lte: sameTimePreviousMonth },
    });

    let monthlyGrowth = 0;
    if (previousMonthCount > 0) {
      monthlyGrowth =
        Math.round(
          ((currentMonthCount - previousMonthCount) / previousMonthCount) *
            1000,
        ) / 10;
    } else if (currentMonthCount > 0) {
      monthlyGrowth = 100;
    }

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        monthlyGrowth,
        profesoresCount,
        bannedUsers,
      },
    });
  },
);

export const getDownloadStats = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();

    const approvedCount = await FileModel.countDocuments({ uploaderId: user.id, status: "approved" });
    const totalUploads = await FileModel.countDocuments({ uploaderId: user.id });
    const consumedCount = await UserDownload.countDocuments({ userId: user.id });

    const maxDownloads = approvedCount * 5;
    const downloadsLeft = Math.max(0, maxDownloads - consumedCount);

    const lastDownload = await UserDownload.findOne({ userId: user.id }).sort({ downloadedAt: -1 });

    return res.json({
      success: true,
      data: {
        downloadsLeft,
        maxDownloads,
        totalUploads,
        lastDownloadDate: lastDownload ? lastDownload.downloadedAt : null,
      },
    });
  },
);
