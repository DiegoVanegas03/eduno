# apps/backend

Este directorio está reservado para el backend de Eduno.

## Estado actual

El código del backend vive actualmente en el repositorio separado `backend-eduno`.  
Para integrarlo al monorepo, sigue estos pasos:

```bash
# Desde la raíz del monorepo
cp -r ../backend-eduno/. apps/backend/
```

## Stack

- Runtime: **Node.js 20** (via Docker, imagen `node:20-alpine`)
- Framework: **Express** + **TypeScript** (`tsx` en dev, `tsc` en build)
- Gestor: **pnpm**
- Base de datos: **MongoDB** (Mongoose)
- Almacenamiento de archivos: **MinIO**
- Antivirus: **ClamAV**
- Auth: **JWT** + **Passport** (Google OAuth, Microsoft OAuth)

## Configuración necesaria

Ver `.env.example` en el repositorio original. Variables clave:
- `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `FRONTEND_URL`
- `MINIO_*`, `CLAMAV_*`, `GOOGLE_*`, `MICROSOFT_*`

## Nombre del workspace

Al mover el backend, actualiza su `package.json` para que el nombre sea:
```json
{ "name": "@eduno/backend" }
```
