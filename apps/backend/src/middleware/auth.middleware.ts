import { Request, Response, NextFunction } from "express";
import { auth } from "@/config/auth";
import { UserRole } from "@eduno/shared";

/**
 * Verifies the session created by better-auth.
 * Populates req.user if valid, otherwise returns 401.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({ headers: req.headers as any });

  if (!session?.user) {
    return res.status(401).json({
      success: false,
      message: "No está autorizado para acceder a esta ruta. Inicie sesión.",
    });
  }

  // Attach user to request
  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role ?? "alumno",
  };

  next();
};

/**
 * Role-based access control guard. Must be used after `protect`.
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
