// ============================================================
// @eduno/shared — Interfaces compartidas entre frontend y backend
// ============================================================

// ─── Roles ───────────────────────────────────────────────────
export type UserRole = 'alumno' | 'profesor' | 'moderador' | 'admin';

// ─── Estado de archivos ───────────────────────────────────────
export type FileStatus = 'pending' | 'approved' | 'rejected';

// ─── Usuario (Base) ──────────────────────────────────────────
export interface IUserBase {
  name: string;
  email: string;
  role: UserRole;
  googleId?: string;
  microsoftId?: string;
}

// ─── Usuario (DTO para Frontend/API) ─────────────────────────
export interface IUser extends IUserBase {
  id: string;
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
export interface IFileBase {
  originalName: string;
  minioObjectName: string;
  size: number;
  mimetype: string;
  isClean: boolean;
}

export interface IFile extends IFileBase {
  id: string;
  uploadedAt: Date;
}

// ─── Respuestas de Auth ───────────────────────────────────────
export interface IUserResponse extends IUserBase {
  id: string;
  initialLetter?: string;
}

export interface IAuthResponse {
  user?: IUserResponse;
  accessToken?: string;
}

// ─── JWT Payload ──────────────────────────────────────────────
export interface IJwtPayload {
  sub: string;   // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
