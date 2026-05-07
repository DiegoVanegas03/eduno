import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import fileRoutes from "./routes/file.routes";
import userRoutes from "./routes/user.routes";
import { logger, stream } from "./utils/logger";

const app: Application = express();

// ── Logger HTTP ──────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream }));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);

app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Eduno API — TypeScript + Express + better-auth" });
});

// ── better-auth handler ───────────────────────────────────────────────────────
// Mounts all auth endpoints under /api/auth:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   GET  /api/auth/sign-in/social  (Google, Microsoft)
//   GET  /api/auth/callback/:provider
app.all("/api/auth/*", toNodeHandler(auth));

// ── API routes ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/files", fileRoutes);
app.use("/api/users", userRoutes);

// ── Global error handler ───────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: Function) => {
  const status = err?.status ?? err?.statusCode ?? 500;
  
  logger.error(`[${status}] ${err?.message || "Unknown error"}`);
  if (err?.body)  logger.error(`   body   → ${JSON.stringify(err.body)}`);
  if (err?.stack) logger.error(`   stack  → ${err.stack.split("\n").slice(0, 4).join("\n           ")}`);

  res.status(status).json({
    success: false,
    error: err?.message || "Error interno del servidor",
  });
});

export default app;
