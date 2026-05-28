import { logger } from "./logger";
import { Request, Response } from "express";

export const GlobalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: Function,
) => {
  const errorObj = err as Error & { statusCode?: number; status?: number; isOperational?: boolean; body?: unknown };
  const status = errorObj?.statusCode ?? errorObj?.status ?? 500;
  const isOperational = err instanceof AppError ? err.isOperational : (errorObj?.isOperational ?? false);

  logger.error(`[${status}] ${errorObj?.message || "Unknown error"}`);
  if (errorObj?.body) logger.error(`   body   → ${JSON.stringify(errorObj.body)}`);
  if (errorObj?.stack)
    logger.error(
      `   stack  → ${errorObj.stack.split("\n").slice(0, 4).join("\n           ")}`,
    );

  // Safeguard internal server error messages from leaking in production
  const errorMsg =
    status === 500 && !isOperational
      ? "Error interno del servidor"
      : errorObj?.message || "Error interno del servidor";

  res.status(status).json({
    success: false,
    error: errorMsg,
  });
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Set prototype explicitly
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Petición incorrecta") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso prohibido") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto en la solicitud") {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Error interno del servidor") {
    super(message, 500, false);
  }
}
