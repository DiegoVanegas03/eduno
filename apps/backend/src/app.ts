import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import fileRoutes from "./routes/file.routes";

const app: Application = express();

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
app.use("/api/files", fileRoutes);

export default app;
