import { Request, Response, NextFunction } from "express";
import { UserRole } from "@eduno/shared";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    return res.status(401).json({ success: false, message: "No autorizado. Sesión inválida o expirada." });
  }

  // Cast user to include possible isBanned property
  const user = session.user as any;
  if (user.isBanned) {
    return res.status(403).json({ success: false, message: "Tu cuenta ha sido suspendida/baneada." });
  }

  // Attach user to request for downstream middlewares
  req.user = user;
  next();
};

/**
 * Role-based access control guard.
 * Requires the upstream middleware (better-auth session check) to have
 * attached req.user before this guard runs.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol '${user?.role}' no tiene permiso para acceder a esta ruta.`,
      });
    }
    next();
  };
};
