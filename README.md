# Eduno — Plataforma de Opiniones y Recursos Académicos

> **Materia:** Aplicaciones Web Escalables · Facultad de Ingeniería, UASLP · Semestre 2025-2026-II  
> **Estudiante:** Diego Emiliano Vanegas Cerda (0303943) · **Profesor:** Francisco Javier Gómez Vázquez

---

## 📌 Propósito del Proyecto

Eduno es una **plataforma web colaborativa y moderada** diseñada para la comunidad estudiantil de la Facultad de Ingeniería de la UASLP. Su objetivo es centralizar tres necesidades recurrentes de los estudiantes:
<img width="1705" height="910" alt="Captura de pantalla 2026-03-23 a la(s) 11 12 24 p m" src="https://github.com/user-attachments/assets/cdbbefad-0984-4738-bdd8-86d2ee451594" />


1. **Opiniones docentes** — Consultar y publicar experiencias reales sobre profesores, organizadas por materia y semestre, con sistema de votos y reportes.
<img width="1704" height="910" alt="Captura de pantalla 2026-03-23 a la(s) 11 13 21 p m" src="https://github.com/user-attachments/assets/b78411bc-d9b8-4d3e-939b-4a642fca7a34" />

2. **Repositorio de apuntes** — Compartir y descargar materiales de estudio bajo un esquema de reciprocidad: para descargar debes haber subido al menos un archivo aprobado por moderación.
<img width="1708" height="885" alt="Captura de pantalla 2026-03-23 a la(s) 11 13 54 p m" src="https://github.com/user-attachments/assets/954539d0-bd56-4542-97d5-7a4bbba4ee17" />


4. **Pizarra de tips** — Compartir consejos sobre horarios, dificultad de materias y elección de profesores por carrera.
<img width="1709" height="910" alt="Captura de pantalla 2026-03-23 a la(s) 11 14 10 p m" src="https://github.com/user-attachments/assets/3156eec3-95dd-46f1-89b9-2f9e44245f0e" />


La plataforma cuenta con **cuatro roles**: Invitado, Estudiante, Moderador y Administrador, cada uno con acceso cuidadosamente acotado. Los datos de profesores y materias se sincronizan automáticamente desde la página oficial de la UASLP mediante un proceso de **web scraping** programado.


---

## 🏗️ Arquitectura del Monorepo

Este repositorio utiliza un **pnpm Workspace Monorepo** orquestado con **Turborepo**, agrupando el frontend, el backend y el código compartido en un mismo repositorio.

```
eduno/                          ← Raíz del monorepo
├── apps/
│   ├── frontend/               ← @eduno/frontend  (Angular SPA)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── core/       # Guards, interceptores, servicios singleton
│   │       │   ├── shared/     # Componentes reutilizables (button, toast, navbar…)
│   │       │   └── features/   # Módulos lazy-loaded por dominio de negocio
│   │       └── environments/
│   └── backend/                ← @eduno/backend   (Node.js REST API)
│       └── src/
│           ├── config/         # DB, MinIO, ClamAV, Passport (OAuth)
│           ├── controllers/    # Lógica de negocio por recurso
│           ├── middleware/     # Auth (JWT), autorización por rol
│           ├── models/         # Esquemas Mongoose (User, Session, File)
│           ├── routes/         # Enrutadores Express
│           └── interfaces/     # Tipos de respuesta de la API
├── packages/
│   └── shared/                 ← @eduno/shared    (Interfaces TypeScript compartidas)
│       └── src/
│           └── index.ts        # IUser, IFile, ISession, IAuthResponse, IJwtPayload
├── docker-compose.yml          ← Infraestructura: MinIO + ClamAV
├── pnpm-workspace.yaml         ← Declaración de workspaces
├── turbo.json                  ← Pipeline de builds (build, dev, lint, test)
└── package.json                ← Scripts raíz de orquestación
```

### ¿Por qué Monorepo?

| Ventaja | Detalle |
|---|---|
| **Tipos compartidos** | `@eduno/shared` garantiza que si una propiedad del backend cambia, el frontend falla en compilación, no en producción. |
| **Un solo `pnpm install`** | Todas las dependencias de los tres workspaces se instalan desde la raíz con un solo comando. |
| **Builds inteligentes con Turbo** | Turborepo cachea los builds. Si solo cambias el frontend, el backend no se recompila. |
| **Infra en un `docker-compose`** | MinIO y ClamAV se levantan en un solo comando desde la raíz sin importar en qué app estás trabajando. |

---

## 🛠️ Stack Tecnológico

### Frontend · `apps/frontend` · `@eduno/frontend`

| Categoría | Tecnología |
|---|---|
| Framework | **Angular 21** (Standalone Components, Signals) |
| Lenguaje | **TypeScript 5.9** |
| Estilos | **Tailwind CSS v4** + PostCSS |
| Routing | Angular Router con **Lazy Loading** por feature |
| HTTP | `HttpClient` con interceptor JWT automático |
| Autenticación | Guards (`AuthGuard`, `RoleGuard`) con JWT claim `role` |
| Gestor de paquetes | **pnpm** |
| Linter / Formato | ESLint (angular-eslint) + Prettier |

### Backend · `apps/backend` · `@eduno/backend`

| Categoría | Tecnología |
|---|---|
| Runtime | **Node.js 20** |
| Framework | **Express 4** |
| Lenguaje | **TypeScript 5.4** (compilado con `tsc`, dev con `tsx --watch`) |
| Base de datos | **MongoDB** via Mongoose |
| Autenticación | **JWT** (access token + refresh token en cookie HttpOnly) |
| OAuth | Passport.js — estrategias **Google** y **Microsoft** |
| Almacenamiento | **MinIO** (S3-compatible, archivos con compresión gzip al vuelo) |
| Antivirus | **ClamAV** (escaneo de archivos antes de almacenarlos) |
| Gestor de paquetes | **pnpm** |

### Infraestructura · `docker-compose.yml` (raíz)

| Servicio | Imagen | Puerto |
|---|---|---|
| MinIO (S3 API) | `minio/minio:latest` | `9000` |
| MinIO Console | `minio/minio:latest` | `9001` |
| ClamAV | `clamav/clamav:latest` | `3310` |

### Shared · `packages/shared` · `@eduno/shared`

Interfaces TypeScript puras, sin dependencias. Compartidas entre frontend y backend para garantizar consistencia de tipos en toda la aplicación.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias (una sola vez desde la raíz)

```bash
pnpm install
```

### 2. Levantar infraestructura Docker

```bash
pnpm docker:up
```

### 3. Configurar variables de entorno del backend

```bash
cp apps/backend/.env.example apps/backend/.env
# Edita apps/backend/.env con tus valores de MONGO_URI, JWT_SECRET, etc.
```

### 4. Correr el backend

```bash
pnpm backend        # → http://localhost:3000
```

### 5. Correr el frontend

```bash
pnpm frontend       # → http://localhost:4200
```

---

## 📜 Scripts raíz disponibles

| Script | Descripción |
|---|---|
| `pnpm build` | Build de todos los workspaces via Turbo |
| `pnpm frontend` | Levanta el frontend Angular en dev |
| `pnpm backend` | Levanta el backend Node con hot-reload |
| `pnpm docker:up` | Inicia MinIO y ClamAV en Docker |
| `pnpm docker:down` | Detiene y elimina los contenedores |
| `pnpm docker:logs` | Streaming de logs de todos los servicios |

---

_Desarrollado para Aplicaciones Web Escalables · UASLP · 2025-2026-II_
