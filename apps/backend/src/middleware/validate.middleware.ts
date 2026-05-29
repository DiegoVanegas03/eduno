import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        file: req.file,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`[Validate Middleware] Error de validación: ${error.message}`);
        return res.status(400).json({
          success: false,
          message: "Error de validación",
          errors: error.issues.map((err) => ({
            path: err.path.slice(1),
            message: err.message,
          })),
        });
      }
      logger.error(`[Validate Middleware] Error inesperado: ${error}`);
      return res
        .status(500)
        .json({ success: false, message: "Error en el midleware de zod" });
    }
  };
};
