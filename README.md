<div align="center">

# Eduno

**Plataforma colaborativa de opiniones y recursos académicos para ingeniería**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.io/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![better-auth](https://img.shields.io/badge/better--auth-1.6-6C47FF?style=flat-square)](https://www.better-auth.com/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)

---

> **Materia:** Aplicaciones Web Escalables  
> **Institución:** Facultad de Ingeniería, UASLP · Semestre 2025-2026-II  
> **Alumno:** Diego Emiliano Vanegas Cerda — `0303943`  
> **Docente:** Francisco Javier Gómez Vázquez

</div>

---

## Propósito

Eduno centraliza tres necesidades recurrentes de los estudiantes de ingeniería:

| Módulo | Descripción |
|---|---|
| **Opiniones docentes** | Reseñas verificadas de profesores por materia y semestre, con sistema de votos y moderación |
| **Repositorio de apuntes** | Esquema de reciprocidad: sube un archivo aprobado para desbloquear todas las descargas |
| **Pizarra de tips** | Consejos sobre horarios, dificultad de materias y elección de profesores por carrera |

La plataforma cuenta con **cuatro roles de acceso**: Invitado · Alumno · Moderador · Administrador. Los datos de profesores y materias se sincronizan automáticamente desde la página oficial de la UASLP mediante **web scraping** programado.

<img width="1705" alt="Landing Eduno" src="https://github.com/user-attachments/assets/cdbbefad-0984-4738-bdd8-86d2ee451594" />
<img width="1704" alt="Opiniones docentes" src="https://github.com/user-attachments/assets/b78411bc-d9b8-4d3e-939b-4a642fca7a34" />
<img width="1708" alt="Repositorio de apuntes" src="https://github.com/user-attachments/assets/954539d0-bd56-4542-97d5-7a4bbba4ee17" />
<img width="1709" alt="Pizarra de tips" src="https://github.com/user-attachments/assets/3156eec3-95dd-46f1-89b9-2f9e44245f0e" />

---

## Arquitectura del Monorepo

Este repositorio utiliza un **pnpm Workspace Monorepo** orquestado con **Turborepo**, agrupando frontend, backend y código compartido en un único repositorio.

```
eduno/
├── apps/
│   ├── frontend/               ← @eduno/frontend  (Angular 21 SPA)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── core/       # Guards, interceptores, servicios singleton
│   │       │   ├── shared/     # Componentes reutilizables (button, toast, navbar…)
│   │       │   └── features/   # Módulos lazy-loaded por dominio de negocio
│   │       └── environments/
│   └── backend/                ← @eduno/backend   (Node.js REST API)
│       └── src/
│           ├── config/         # DB (Mongoose), MinIO, ClamAV, better-auth
│           ├── controllers/    # Lógica de negocio por recurso
│           ├── middleware/     # Autenticación de sesión, autorización por rol
│           ├── models/         # Esquemas Mongoose (User, File)
│           ├── routes/         # Enrutadores Express
│           └── types/          # Declaraciones TypeScript globales
├── packages/
│   └── shared/                 ← @eduno/shared    (Interfaces TypeScript compartidas)
│       └── src/
│           └── index.ts        # IUser, IFile, UserRole, IAuthResponse
├── docker-compose.yml          ← Infraestructura: MinIO + ClamAV
├── pnpm-workspace.yaml
├── turbo.json                  ← Pipeline: build → dev → lint → test
└── package.json                ← Scripts de orquestación raíz
```

### ¿Por qué Monorepo?

| Ventaja | Detalle |
|---|---|
| **Tipos compartidos** | `@eduno/shared` garantiza que si una propiedad del backend cambia, el frontend falla en compilación, no en producción |
| **Un solo `pnpm install`** | Todas las dependencias de los tres workspaces se instalan desde la raíz |
| **Builds inteligentes** | Turborepo cachea los builds; si solo cambias el frontend, el backend no se recompila |
| **Infra unificada** | MinIO y ClamAV se levantan con un solo comando desde la raíz |

---

## Stack Tecnológico

### Frontend · `@eduno/frontend`

| Categoría | Tecnología |
|---|---|
| Framework | **Angular 21** (Standalone Components, Signals) |
| Lenguaje | **TypeScript 5.9** |
| Estilos | **Tailwind CSS v4** + PostCSS |
| Routing | Angular Router con **Lazy Loading** por feature |
| HTTP | `HttpClient` con interceptor de sesión automático |
| Autenticación | Guards (`AuthGuard`, `RoleGuard`) basados en sesión de better-auth |
| Linter / Formato | ESLint (angular-eslint) + Prettier |
| Gestor de paquetes | **pnpm** |

### Backend · `@eduno/backend`

| Categoría | Tecnología |
|---|---|
| Runtime | **Node.js 20** |
| Framework | **Express 4** |
| Lenguaje | **TypeScript 5.4** (`tsx --watch` en dev, `tsc` en producción) |
| Base de datos | **MongoDB** via Mongoose |
| **Autenticación** | **better-auth 1.6** — email/password + OAuth (Google, Microsoft) |
| **OAuth** | Manejado nativamente por better-auth (sin Passport.js) |
| Almacenamiento | **MinIO** (S3-compatible, archivos con compresión gzip) |
| Antivirus | **ClamAV** (escaneo de archivos antes de almacenarlos) |
| Gestor de paquetes | **pnpm** |

### Infraestructura · `docker-compose.yml`

| Servicio | Imagen | Puerto |
|---|---|---|
| MinIO (S3 API) | `minio/minio:latest` | `9000` |
| MinIO Console | `minio/minio:latest` | `9001` |
| ClamAV | `clamav/clamav:latest` | `3310` |

### Shared · `@eduno/shared`

Interfaces TypeScript puras, sin dependencias de runtime. Compartidas entre frontend y backend para garantizar consistencia de tipos en toda la aplicación (`IUser`, `IFile`, `UserRole`, `IAuthResponse`).

---

## Autenticación con better-auth

El backend utiliza [**better-auth**](https://www.better-auth.com/) como capa de autenticación completa, reemplazando la implementación manual de JWT + Passport.js.

### ¿Qué gestiona better-auth automáticamente?

| Responsabilidad | Detalle |
|---|---|
| **Registro / Login** | `POST /api/auth/sign-up/email` y `POST /api/auth/sign-in/email` |
| **Sesiones** | Cookies `HttpOnly` con rotación automática de tokens |
| **Sign-out** | `POST /api/auth/sign-out` con invalidación de sesión en BD |
| **OAuth — Google** | `/api/auth/sign-in/social` → redirect → `/api/auth/callback/google` |
| **OAuth — Microsoft** | `/api/auth/sign-in/social` → redirect → `/api/auth/callback/microsoft` |
| **Colecciones MongoDB** | Crea y gestiona las colecciones `user`, `session`, `account` automáticamente |

### Configuración (`src/config/auth.ts`)

```typescript
export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  baseURL: process.env.BASE_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.FRONTEND_URL],
  emailAndPassword: { enabled: true },
  socialProviders: {
    google:    { clientId, clientSecret },
    microsoft: { clientId, clientSecret, tenantId },
  },
});
```

### Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `PORT` | Puerto Express (default: `3000`) |
| `BASE_URL` | URL del backend (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | URL del frontend para CORS (e.g. `http://localhost:4200`) |
| `MONGO_URI` | URI de conexión a MongoDB |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones — genera con `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | OAuth Google (Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `MICROSOFT_CLIENT_ID` | OAuth Microsoft (Azure Portal) |
| `MICROSOFT_CLIENT_SECRET` | OAuth Microsoft |
| `MICROSOFT_TENANT_ID` | Azure AD tenant (`common` para cualquier cuenta Microsoft) |
| `MINIO_ENDPOINT/PORT/ACCESS_KEY/SECRET_KEY/BUCKET` | Config MinIO |
| `CLAMAV_HOST/PORT` | Config ClamAV |

---

## Inicio Rápido

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url> eduno
cd eduno
pnpm install
```

### 2. Levantar infraestructura Docker

```bash
pnpm docker:up
```

Esto levanta MinIO (puerto `9000`/`9001`) y ClamAV (puerto `3310`).

### 3. Configurar variables de entorno

```bash
cp apps/backend/.env.example apps/backend/.env
# Edita .env con tus valores de MONGO_URI, BETTER_AUTH_SECRET, OAuth, etc.
```

> **Genera un secreto seguro para producción:**
> ```bash
> openssl rand -hex 32
> ```

### 4. Correr en desarrollo

```bash
# Backend — http://localhost:3000
pnpm backend

# Frontend — http://localhost:4200
pnpm frontend
```

O ambos simultáneamente desde la raíz:

```bash
pnpm dev
```

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `pnpm dev` | Levanta todos los workspaces en paralelo (Turbo) |
| `pnpm build` | Build de producción de todos los workspaces |
| `pnpm frontend` | Levanta el frontend Angular en modo dev |
| `pnpm backend` | Levanta el backend Node con hot-reload (`tsx --watch`) |
| `pnpm lint` | ESLint en todos los workspaces |
| `pnpm test` | Tests en todos los workspaces |
| `pnpm docker:up` | Inicia MinIO y ClamAV en Docker |
| `pnpm docker:down` | Detiene y elimina los contenedores |
| `pnpm docker:logs` | Streaming de logs de todos los servicios |

---

## Estructura de permisos

| Rol | Descripción |
|---|---|
| **Invitado** | Solo lectura pública — puede consultar profesores y materias |
| **Alumno** | Puede publicar reseñas, subir y descargar apuntes |
| **Moderador** | Puede aprobar/rechazar archivos y moderar reseñas |
| **Administrador** | Acceso total — gestión de usuarios, sincronización de datos |

---

<div align="center">

_Desarrollado para **Aplicaciones Web Escalables** · Facultad de Ingeniería UASLP · 2025-2026-II_

</div>
