import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  getMe,
  oauthCallback,
  refresh,
  logout,
} from "@/controllers/auth.controller";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

// --- RUTAS DE AUTENTICACIÓN LOCAL ---
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// --- RUTAS DE PERFIL ---
router.get("/me", protect, getMe);

// --- RUTAS DE GOOGLE OAUTH ---
// Iniciar sesión con Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Callback de Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/login",
  }),
  oauthCallback,
);

// --- RUTAS DE MICROSOFT OAUTH ---
// Iniciar sesión con Microsoft
router.get(
  "/microsoft",
  passport.authenticate("microsoft", {
    prompt: "select_account",
  }),
);

// Callback de Microsoft
router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    session: false,
    failureRedirect: "/api/auth/login",
  }),
  oauthCallback,
);

export default router;
