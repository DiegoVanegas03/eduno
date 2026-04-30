import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth";
import fileRoutes from "./routes/file.routes";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Eduno API — TypeScript + Express + better-auth" });
});

// ── better-auth handler ───────────────────────────────────────────────────────
// Mounts all auth endpoints under /api/auth  (sign-in, sign-up, sign-out,
// /api/auth/google, /api/auth/google/callback, /api/auth/microsoft, …)
app.all("/api/auth/*splat", toNodeHandler(auth));

// ── Custom API routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);   // /api/auth/me
app.use("/api/files", fileRoutes);

export default app;
