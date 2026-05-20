import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

// Services
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";

// Routes
import fileRoutes from "./routes/file.routes";
import userRoutes from "./routes/user.routes";

// Utils
import { GlobalErrorHandler } from "./utils/app-error";
import { stream } from "./utils/logger";

const app: Application = express();

// ── Logger HTTP ──────────────────────────────────────────────────────────────
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream,
  }),
);

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
app.use(GlobalErrorHandler);

export default app;
