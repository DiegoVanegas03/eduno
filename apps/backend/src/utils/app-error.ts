import { logger } from "./logger";
import { Request, Response } from "express";

export const GlobalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: Function,
) => {
  const status = err?.statusCode ?? err?.status ?? 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  logger.error(`[${status}] ${err?.message || "Unknown error"}`);
  if (err?.body) logger.error(`   body   → ${JSON.stringify(err.body)}`);
  if (err?.stack)
    logger.error(
      `   stack  → ${err.stack.split("\n").slice(0, 4).join("\n           ")}`,
    );

  // Safeguard internal server error messages from leaking in production
  const errorMsg =
    status === 500 && !isOperational
      ? "Error interno del servidor"
      : err?.message || "Error interno del servidor";

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
