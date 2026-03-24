import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import fileRoutes from "./routes/file.routes";
import authRoutes from "./routes/auth.routes";
import "./config/passport"; // Initialize passport config
const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Ruta principal para verificar salud del server
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenido al API en TypeScript + MVC + Auth" });
});

// Inicializar Passport (necesario aunque usemos jwt/session=false)
app.use(passport.initialize());

// Registrar rutas integradas
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

export default app;
