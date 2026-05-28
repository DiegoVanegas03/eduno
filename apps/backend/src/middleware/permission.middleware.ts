import { Request, Response, NextFunction } from "express";
import { roles, Resource, permissionsStatement } from "@/config/permissions";
import { UnauthorizedError, ForbiddenError } from "@/utils/app-error";

/**
 * Generic Express Middleware to enforce permission-based access control (PBAC)
 * with strict compile-time type-safety and autocompletion.
 *
 * @param resource The resource to check (e.g., 'user', 'session', 'scraper')
 * @param action The allowed action on that resource (inferred dynamically)
 */
export const requirePermission = <R extends Resource>(
  resource: R,
  action: (typeof permissionsStatement)[R][number],
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Injected previously by 'isAuthenticated' middleware

    if (!user) {
      throw new UnauthorizedError("Usuario no autenticado");
    }

    // Lookup the native Role object in the centralized roles map
    const userRoleName = user.role as keyof typeof roles;
    const activeRole = roles[userRoleName];

    if (!activeRole) {
      throw new ForbiddenError(
        "Rol de usuario inválido o no registrado en el sistema AC.",
      );
    }

    // Call authorize directly on the Role object with the correct structure: { [resource]: [action] }
    const authResult = (
      activeRole as unknown as {
        authorize: (query: Record<string, string[]>) => {
          success: boolean;
          error?: string;
        };
      }
    ).authorize({
      [resource]: [action],
    });

    if (!authResult || !authResult.success) {
      throw new ForbiddenError(
        `Permiso denegado: No tienes autorización para realizar '${action}' en el recurso '${resource}'.`,
      );
    }

    next();
  };
};
