import { Request, Response } from "express";
import { UserRole } from "@eduno/shared";

/**
 * GET /api/auth/me  (protected)
 *
 * Returns the currently authenticated user's profile.
 * req.user is already populated by the `protect` middleware.
 */
export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "No autenticado" });
  }

  const user = req.user;

  res.status(200).json({
    success: true,
    message: "Perfil obtenido exitosamente",
    user: {
      id: user.id,
      initialLetter: user.name.charAt(0).toUpperCase(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    },
  });
};
