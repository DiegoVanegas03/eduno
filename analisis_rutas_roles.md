# Análisis de Rutas y Roles: Plataforma de Opiniones y Recursos Académicos

En base a las instrucciones y requerimientos del proyecto, a continuación se presenta una propuesta estructurada para el manejo de rutas (tanto a nivel de API/Backend, como vistas de Frontend) y los permisos asociados a cada rol.

## Resumen de Roles definidos

1. **Invitado (Usuario No Autenticado):** Acceso a lectura pública, landing page y registro/login.
2. **Estudiante (Usuario Registrado):** Puede interactuar (comentar, subir, votar). Tiene restricción condicional para descargar archivos.
3. **Moderador:** Mantiene la calidad de la plataforma. Gestiona reportes y aprueba contenido.
4. **Administrador:** Control total, gestión de catálogos y web scraping.

---

## Estructura de Rutas Propuesta

### 1. Rutas Públicas (Acceso para Todos)

Cualquier usuario, autenticado o no, puede acceder a estas rutas.

- **`/` (Landing Page)**
  - **Acción:** Visualizar información del sitio, propósito y políticas.
- **`/auth/login` y `/auth/register`**
  - **Acción:** Iniciar sesión y registrar una cuenta. (Generalmente se ocultan si el usuario ya está autenticado).
- **`/auth/recuperar-password`**
  - **Acción:** Flujo para restablecimiento de contraseñas.
- **`/profesores`**
  - **Acción:** Buscar y listar profesores, aplicar filtros por materia o carrera.
- **`/profesores/:id`**
  - **Acción:** Ver perfil del docente, historial, materias impartidas y leer las opiniones publicadas.
- **`/tips`**
  - **Acción:** Leer consejos y tips generales de las carreras.
- **`/estadisticas`**
  - **Acción:** Ver métricas públicas de la plataforma (ej. profesores con más calificaciones, materias con más apuntes).

---

### 2. Rutas de Estudiantes (Requieren Autenticación)

Accesibles por Estudiantes, Moderadores y Administradores (estos heredan permisos básicos).

#### Opiniones e Interacción

- **`POST /profesores/:id/opiniones`**
  - **Acción:** Publicar una nueva opinión sobre un profesor.
  - _Nota:_ Deberá incluir moderación automática básica en backend para palabras prohibidas.
- **`POST /profesores/:id/opiniones/:opinionId/votar`**
  - **Acción:** Dar o quitar un "voto útil" a una opinión.
- **`POST /profesores/:id/opiniones/:opinionId/reportar`**
  - **Acción:** Reportar una opinión por abuso o contenido inapropiado.

#### Repositorio de Apuntes

- **`GET /apuntes`**
  - **Acción:** Explorar y buscar apuntes por etiqueta (materia, profesor, carrera, semestre).
- **`POST /apuntes`**
  - **Acción:** Subir un nuevo archivo/apunte.
  - _Nota:_ El estado inicial de este registro en la base de datos es "pendiente" hasta ser aprobado por un moderador.
- **`GET /apuntes/:id/descargar`**
  - **Acción:** Descargar el archivo.
  - **🔥 RESTRICCIÓN CLAVE:** El sistema validará que el Estudiante tenga _al menos un archivo subido con estado "aprobado"_. Si no cumple, recibe un error de acceso denegado (ej. HTTP 403). Los Moderadores y Administradores exentan esta validación.
- **`GET /apuntes/:id/preview`**
  - **Acción:** Ver vista previa segura del documento (si está implementado).

#### Pizarra de Consejos

- **`GET /tips/carrera/:id`**
  - **Acción:** Ver tips específicos de su carrera elegida.
- **`POST /tips`**
  - **Acción:** Publicar un nuevo consejo.
- **`POST /tips/:id/votar` y `POST /tips/:id/comentar`**
  - **Acción:** Interactuar en discusiones o consejos de la plataforma.

#### Perfil de Usuario

- **`GET /perfil`** o **`GET /mis-archivos`**
  - **Acción:** Ver historial personal: apuntes subidos (y el estado de revisión: pendiente/aprobado/rechazado), editar datos propios de la carrera.

---

### 3. Rutas de Moderación (Requieren Rol Moderador o Administrador)

Diseñadas para mantener la calidad colaborativa y el cumplimiento de las políticas.

- **`GET /moderacion/apuntes`**
  - **Acción:** Listar todos los apuntes subidos que recientemente entraron en estado "pendiente".
- **`POST /moderacion/apuntes/:id/aprobar`**
  - **Acción:** Cambiar estado del apunte a "aprobado". Al completarse esta acción, el perfil del estudiante autor del apunte gana automáticamente el permiso para descargar del sistema.
- **`POST /moderacion/apuntes/:id/rechazar`**
  - **Acción:** Rechazar un documento si es irrelevante, contiene trampas (ej. exámenes de evaluación actuales) o información comprometida.
- **`GET /moderacion/reportes`**
  - **Acción:** Ver el flujo de alertas generadas por los estudiantes sobre posibles opiniones o comentarios que incumplen políticas.
- **`POST /moderacion/reportes/:id/resolver`**
  - **Acción:** Atender un reporte activo (ej. eliminar comentario y silenciar autor, o bien, descartarlo si fue un error).
- **`POST /moderacion/usuarios/:id/bloquear`**
  - **Acción:** Suspender actividad de una cuenta infractora temporal o permanentemente.

---

### 4. Rutas de Administración (Requieren Rol Administrador)

Operaciones para mantener funcionando el ecosistema y catálogos internos.

- **`GET /admin/dashboard`**
  - **Acción:** Estadísticas vitales, número de usuarios, volumen de almacenamiento, salud del web scraper.
- **`GET /admin/usuarios`, `PUT /admin/usuarios/:id/rol`**
  - **Acción:** Gestión del personal. Aquí un Administrador puede buscar a un Estudiante destacado y ascenderlo al rol de Moderador.
- **Gestión de Catálogos CRUD (`GET`, `POST`, `PUT`, `DELETE`)**
  - Categorías: `/admin/catalogos/profesores`, `/admin/catalogos/materias`, `/admin/catalogos/carreras`.
  - **Acción:** Aunque el Web Scraping carga profesores, el admin debe poder corregir o agregar materias y carreras manualmente.
- **`POST /admin/scraper/ejecutar`**
  - **Acción:** Disparar manualmente el proceso estructurado que lee la página oficial de la UASLP para actualizar el catálogo.
- **`GET /admin/scraper/logs`**
  - **Acción:** Ver la bitácora para asegurar que el job programado (cron) se está ejecutando óptimamente sin errores.

---

## 🔑 Recomendaciones Claves de Implementación

1. **La barrera para descargar (El candado de compartición):**
   - En el frontend: Si el usuario no tiene aportes aprobados, el botón "Descargar" en el repositorio debe estar bloqueado o redirigir a un modal que diga: _"Para descargar contenido de la comunidad, primero debes aportar algo valioso. Sube tus apuntes para su revisión."_
   - En el backend: Valida esto directamente en la base de datos al acceder al _endpoint_ de descarga, no confíes nunca en la ocultación del Frontend.

2. **Seguridad JWT (Tokens):**
   - Tu JWT debe contener el campo `role` como _claim_ (`role: 'student' | 'moderator' | 'admin'`). Así, las vistas en la web pueden moldearse sin preguntar al backend cada vez.
   - Utiliza middlewares para agrupar rutas en tu servidor (ej. un grupo de rutas en Express/Nest o en Spring Boot bajo el prefijo `/api/admin` que exija siempre rol ADMIN).

3. **Status de los Archivos:**
   - Tus tablas de base de datos deberían manejar un enumerador de estados para el Repositorio de Apuntes: `PENDING` (Pendiente), `APPROVED` (Aprobado), `REJECTED` (Rechazado).
