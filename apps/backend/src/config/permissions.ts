import { createAccessControl } from "better-auth/plugins";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Centralized permissions statement for dynamic type inference
export const permissionsStatement = {
  user: [
    ...defaultStatements.user,
    "read"
  ],
  session: [
    ...defaultStatements.session,
    "read"
  ],
  scraper: ["execute", "save"],
  comment: ["create", "delete"],
  rating: ["create"],
  file: ["upload", "download"],
  career: ["create", "read", "update", "delete"],
  studyPlan: ["create", "read", "update", "delete"],
} as const;

export type Resource = keyof typeof permissionsStatement;

// Define Access Control for native system roles
export const ac = createAccessControl(permissionsStatement);

const adminRole = ac.newRole({
  ...adminAc.statements,
  user: [
    ...adminAc.statements.user,
    "read"
  ],
  session: [
    ...adminAc.statements.session,
    "read"
  ],
  scraper: ["execute", "save"],
  comment: ["create", "delete"],
  rating: ["create"],
  file: ["upload", "download"],
  career: ["create", "read", "update", "delete"],
  studyPlan: ["create", "read", "update", "delete"],
});

const moderadorRole = ac.newRole({
  user: ["get", "list", "read"],
  session: ["list", "read"],
  scraper: ["execute"], // Puede ejecutar scraping pero no guardar en base de datos
  comment: ["delete"],  // Moderador puede borrar comentarios inapropiados
  rating: [],
  file: ["download"],
  career: ["read"],
  studyPlan: ["read"],
});

const profesorRole = ac.newRole({
  comment: ["create"],
  rating: ["create"],
  file: ["upload", "download"],
  career: ["read"],
  studyPlan: ["read"],
});

const alumnoRole = ac.newRole({
  comment: ["create"],
  rating: ["create"],
  file: ["upload", "download"],
  career: ["read"],
  studyPlan: ["read"],
});

export const roles = {
  admin: adminRole,
  moderador: moderadorRole,
  profesor: profesorRole,
  alumno: alumnoRole,
} as const;