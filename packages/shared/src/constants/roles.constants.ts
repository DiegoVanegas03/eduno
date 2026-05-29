export const USER_ROLES = {
  ALUMNO: 'alumno',
  PROFESOR: 'profesor',
  MODERADOR: 'moderador',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const rolesTuple = [
  USER_ROLES.ALUMNO,
  USER_ROLES.PROFESOR,
  USER_ROLES.MODERADOR,
  USER_ROLES.ADMIN,
] as const;