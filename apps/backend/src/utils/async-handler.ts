import { Request, Response, NextFunction, RequestHandler } from "express";
import { logger } from "./logger";

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express's global error handler via `next(error)`.
 * This eliminates the need for try/catch in every controller.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error(`[asyncHandler] Error en controlador: ${error?.message || error}`);
      next(error);
    });
  };
