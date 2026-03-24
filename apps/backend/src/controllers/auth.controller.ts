import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import User, { IUser } from "@/models/user.model";
import Session from "@/models/session.model";
import { IAuthResponse, mapUserToResponse } from "@/interfaces/auth.interface";

const JWT_SECRET = process.env.JWT_SECRET || "mi_super_secreto_super_seguro_cambiame_en_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "otro_secreto_para_refresh_tokens";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// Helper to sign access token
const signAccessToken = (id: string | unknown) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// Helper to sign refresh token
const signRefreshToken = (id: string | unknown) => {
  return jwt.sign({ id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// Helper to set cookies
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    const { name, email, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Por favor ingrese una contraseña",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un usuario con ese correo electrónico",
      });
    }

    const user = (await User.create({ name, email, password })) as IUser;

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registrando el usuario",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const login = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, ingrese un correo electrónico y una contraseña",
      });
    }

    const user = (await User.findOne({ email }).select("+password")) as IUser;

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const refresh = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No hay token de refresco" });
    }

    const session = await Session.findOne({ refreshToken });
    if (!session) {
      return res.status(401).json({ success: false, message: "Sesión inválida o revocada" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { id: string };
    
    const newAccessToken = signAccessToken(decoded.id);
    const newRefreshToken = signRefreshToken(decoded.id);
    
    session.refreshToken = newRefreshToken;
    await session.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({ 
      success: true, 
      message: "Token renovado exitosamente" 
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: "Error al refrescar el token",
      error: error instanceof Error ? error.message : "Token inválido"
    });
  }
};

export const logout = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await Session.deleteOne({ refreshToken });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ 
      success: true, 
      message: "Sesión cerrada exitosamente" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al cerrar sesión" 
    });
  }
};

export const getMe = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Perfil obtenido exitosamente",
      user: mapUserToResponse(req.user as IUser),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los datos del usuario",
    });
  }
};

export const oauthCallback = async (req: Request, res: Response<IAuthResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No se pudo autenticar con el proveedor.",
      });
    }

    const user = req.user as IUser;
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await Session.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Autenticación OAuth exitosa",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno conectando con el proveedor OAuth.",
    });
  }
};



