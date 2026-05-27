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
import scraperRoutes from "./routes/scraper.routes";
import scheduleRoutes from "./routes/schedule.routes";
import careerRoutes from "./routes/career.routes";
import studyPlanRoutes from "./routes/study-plan.routes";

// Utils
import { GlobalErrorHandler } from "./utils/app-error";
import { stream } from "./utils/logger";

const app: Application = express();
app.set("trust proxy", true);

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
app.all(
  "/api/auth/*",
  (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "";
    req.headers["x-real-ip"] = ip;
    req.headers["x-forwarded-for"] = ip;
    next();
  },
  toNodeHandler(auth),
);

// ── API routes ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/files", fileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scraper", scraperRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/study-plans", studyPlanRoutes);

// ── Global error handler ───────────────────────────────────────────────────
app.use(GlobalErrorHandler);

export default app;
