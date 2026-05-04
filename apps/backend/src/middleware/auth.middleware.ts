import { Request, Response, NextFunction } from "express";
import { UserRole } from "@eduno/shared";

/**
 * Role-based access control guard.
 * Requires the upstream middleware (better-auth session check) to have
 * attached req.user before this guard runs.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol '${req.user?.role}' no tiene permiso para acceder a esta ruta.`,
      });
    }
    next();
  };
};
