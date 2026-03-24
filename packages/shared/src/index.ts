// ============================================================
// @eduno/shared — Interfaces compartidas entre frontend y backend
// ============================================================

// ─── Roles ───────────────────────────────────────────────────
export type UserRole = 'student' | 'moderator' | 'admin';

// ─── Estado de archivos ───────────────────────────────────────
export type FileStatus = 'pending' | 'approved' | 'rejected';

// ─── Usuario ──────────────────────────────────────────────────
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  googleId?: string;
  microsoftId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sesión ───────────────────────────────────────────────────
export interface ISession {
  id: string;
  userId: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
}

// ─── Archivo / Apunte ─────────────────────────────────────────
export interface IFile {
  id: string;
  originalName: string;
  minioObjectName: string;
  size: number;
  mimetype: string;
  status: FileStatus;
  isClean: boolean;
  uploadedBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}

// ─── Respuestas de Auth ───────────────────────────────────────
export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IAuthResponse {
  user: IUserResponse;
  accessToken: string;
}

// ─── JWT Payload ──────────────────────────────────────────────
export interface IJwtPayload {
  sub: string;   // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
