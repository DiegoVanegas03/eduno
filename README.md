# Eduno - Plataforma de Opiniones y Recursos Académicos

Eduno es una plataforma colaborativa y escalable diseñada específicamente para estudiantes de la Facultad de Ingeniería de la Universidad Autónoma de San Luis Potosí (UASLP). La aplicación promueve una comunidad solidaria a través de opiniones docentes sinceras, un repositorio de apuntes moderado y una pizarra de tips universitarios.

## Arquitectura del Proyecto (Frontend)

El proyecto Angular se ha estructurado siguiendo un modelo basado en características (Feature-based architecture), que promueve el principio de escalabilidad y separación de responsabilidades. A continuación, se detalla la estructura principal:

```
src/
├── app/                  # Contiene la lógica principal de la aplicación
│   ├── core/             # Servicios Singleton, guards, interceptores (importados una vez en la app raíz)
│   ├── shared/           # Componentes reusables, directivas y pipes usados en múltiples características
│   │   └── components/
│   │       └── navbar/   # Ejemplo: Navbar compartida
│   ├── features/         # Módulos específicos de características (ej. dashboard, auth), idealmente con lazy-load
│   │   └── landing/      # Ejemplo: Landing page
│   ├── app.component.ts  # Componente raíz (app.ts)
│   ├── app.config.ts     # Configuración de proveedores para versión Standalone de Angular
│   └── app.routes.ts     # Configuración de enrutamiento principal (Lazy loading)
├── assets/               # Archivos estáticos como imágenes (ej: eduno-study.png), fuentes y JSON
├── environments/         # Archivos de configuración de entorno (ej: development vs. production)
├── index.html            # Archivo HTML principal donde arranca la app
├── main.ts               # Punto de entrada de la aplicación
└── styles.css            # Estilos globales y configuración de Tailwind CSS
```

### Explicación de las Carpetas Principales

- **`core/`**: Se reserva para funcionalidades críticas que proveen contexto global. Cosas como interceptores HTTP, servicios de autenticación y dependencias globales deben ir aquí. **No** se deben incluir componentes visuales.
- **`shared/`**: Aquí residen los "dumb components" y componentes reutilizables (como botones, barras de navegación, campos de formulario) que se utilizan a lo largo y ancho de las _features_.
- **`features/`**: Cada carpeta dentro de features representa un módulo de dominio o una funcionalidad principal del usuario (ej. Landing, Auth, Dashboard, Explorador de Profesores). Promueve el enrutamiento y carga diferida (lazy loading).
- **`environments/`**: Separación de las variables de entorno para tener configuraciones limpias según el entorno donde se va a desplegar (local, dev, pdn).

## Inicio Rápido

Para ejecutar el proyecto en modo de desarrollo:

1. Instala las dependencias (ej. `npm install` o `pnpm install`).
2. Levanta el servidor usando `npm run dev` (o `ng serve`).
3. Navega hacia `http://localhost:4200/`.

## Tecnologías Principales

- **Angular 19** (Standalone Components)
- **Tailwind CSS v4** (Para utilidades de estilado y variables de diseño rápido)
- **UI/UX Pro Max** guidelines implementadas

---

_Desarrollado para Aplicaciones Web Escalables, Semestre 2025-2026-II._
