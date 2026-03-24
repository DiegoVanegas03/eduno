# Backend API Node.js (Local) + Docker Services

Este proyecto contiene tu API en **TypeScript** usando Arquitectura MVC. Para maximizar la velocidad de desarrollo, el servidor Node corre directamente en tu equipo local (`pnpm run dev`), mientras que las herramientas pesadas (Almacenamiento y Antivirus) corren en Docker.

## Prerrequisitos

1. Tener instalado Node.js, `pnpm` (`corepack enable`) y tsx.
2. Tener corriendo un servidor **MongoDB** en tu máquina (por defecto apuntará a `mongodb://localhost:27017/mi_base_datos`).

## Iniciar los Servicios Pesados (Docker)

Solo necesitamos MinIO y ClamAV en contenedores:

```bash
docker compose up -d
```

> Nota: ClamAV tarda unos 15-30 segundos la primera vez en descargar firmas actualizadas.

## Levantar tu Backend Localmente

Como ya tienes las dependencias instaladas en tu Mac localmente:

```bash
pnpm run dev
```

El servidor estará escuchando y compilando TypeScript usando `tsx` desde http://localhost:3000

## Compresión Gzip (Nuevo Flujo)

Ahora tus archivos, además de ser analizados por virus por el contenedor de ClamAV, son **comprimidos al vuelo (gzip)** por tu de backend de Node antes de enviarse a MinIO. Esto optimizará brutalmente tus requerimientos de almacenamiento SSD.

### Test de compresión y subida:

```bash
echo "Texto de prueba super largo para comprobar que la compresion de zlib hace que los textos repetitivos sean minúsculos..." > prueba.txt
curl -X POST http://localhost:3000/api/files/upload -F "documento=@prueba.txt"
```

El JSON devuelto tendrá la propiedad `compressionRatio`.

## Interfaces Administrativas

- MinIO S3 Console: http://localhost:9001 (`minioadmin` / `minioadmin`). Revisa cómo tu archivo `.gz` fue almacenado exitosamente.
