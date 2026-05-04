// ============================================================
// @eduno/shared — Interfaces compartidas entre frontend y backend
// ============================================================

// ─── Roles ───────────────────────────────────────────────────
export const USER_ROLES = {
  ALUMNO: 'alumno',
  PROFESOR: 'profesor',
  MODERADOR: 'moderador',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ─── Estado de archivos ───────────────────────────────────────
export const FILE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

// ─── Usuario (Base) ──────────────────────────────────────────
// googleId y microsoftId fueron eliminados: better-auth los gestiona
// en su propia colección `account`, no en el documento del usuario.
export interface IUserBase {
  name: string;
  email: string;
  role: UserRole;
}

// ─── Usuario (DTO completo) ───────────────────────────────────
export interface IUser extends IUserBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Usuario (DTO para respuestas de API / Frontend) ─────────
export interface IUserResponse extends IUserBase {
  id: string;
  initialLetter?: string;
}

// ─── Respuesta de Auth ────────────────────────────────────────
// accessToken fue eliminado: better-auth gestiona la sesión
// mediante cookies HttpOnly, no devuelve tokens en el body.
export interface IAuthResponse {
  user?: IUserResponse;
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
