export const USER_ROLES = {
  ALUMNO: 'alumno',
  PROFESOR: 'profesor',
  MODERADOR: 'moderador',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
