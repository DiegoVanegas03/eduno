Esta es la **Propuesta de plataforma** para la Facultad de Ingeniería de la UASLP, organizada y estructurada en formato Markdown:

---

# Propuesta de Diseño: Plataforma de Opiniones y Recursos Académicos

**Facultad de Ingeniería - UASLP** 

**Estudiante:** Vanegas Cerda Diego Emiliano (Clave: 0303943) 

**Catedrático:** Gomez Vazquez Francisco Javier 

**Materia:** Aplicaciones Web Escalables 

**Semestre:** 2025-2026-II 

**Fecha de entrega:** Jueves 19 de febrero de 2026 

---

## 1. Descripción del Proyecto

Desarrollo de una **plataforma web colaborativa** diseñada específicamente para los estudiantes de la Facultad de Ingeniería de la Universidad Autónoma de San Luis Potosí (UASLP).

### Funcionalidades principales:

* 
**Consulta de opiniones:** Revisar experiencias sobre diversos profesores.


* 
**Repositorio de recursos:** Compartir y descargar apuntes y guías de estudio.


* 
**Tips por carrera:** Acceder a consejos específicos de cada programa académico.


* 
**Historial docente:** Visualizar la trayectoria histórica de los profesores en la facultad.


* 
**Moderación activa:** Sistema para garantizar la calidad académica y prevenir el contenido que fomente trampas.



---

## 2. Objetivos

### Objetivo General

Crear una plataforma confiable y moderada que centralice las experiencias académicas y los recursos de estudio para la comunidad estudiantil de ingeniería.

### Objetivos Específicos

* Centralizar la información de docentes organizada por materia.


* Fomentar la colaboración activa entre estudiantes.


* Garantizar la calidad del contenido mediante procesos de moderación.


* Automatizar la carga de datos académicos oficiales mediante técnicas de *web scraping*.



---

## 3. Roles de Usuario

### Usuario No Autenticado

* 
**Puede:** Ver la landing page, consultar opiniones de profesores, explorar estadísticas públicas y navegar por tips generales.


* 
**Restricciones:** No puede descargar archivos, publicar opiniones ni subir contenido.



### Usuario Registrado (Estudiante)

* 
**Puede:** Iniciar sesión, subir apuntes/guías, publicar opiniones de docentes, participar en tips por carrera y ver historial docente.


* 
**Restricción Clave:** Para poder descargar documentos, el usuario debe tener al menos un archivo propio aprobado por el equipo de moderación.



### Moderador

* 
**Responsabilidades:** Aprobar o rechazar archivos, revisar reportes, eliminar contenido inapropiado, validar la calidad académica y bloquear usuarios si es necesario.


* 
**Meta:** Mantener el control de calidad del sitio.



### Administrador

* 
**Permisos Exclusivos:** Ejecutar el *web scraping*, cargar/editar profesores, materias y carreras, gestionar usuarios y visualizar métricas globales del sistema.



---

## 4. Módulos del Sistema

### A. Landing Page (Acceso Público)

* 
**Contenido:** Propósito del sitio, avisos anti-trampa, políticas de respeto al docente, beneficios para el estudiante y acceso a registro/login.



### B. Autenticación

* 
**Seguridad:** Uso de JWT + *refresh tokens* y opción de OAuth institucional.


* 
**Funciones:** Registro, inicio de sesión y recuperación de contraseña.



### C. Módulo de Profesores y Opiniones

* 
**Perfil Docente:** Listado de materias impartidas, historial por semestre y rating promedio (escala 1-5).


* 
**Interacción:** Comentarios textuales, votos útiles y reportes de abuso.


* 
**Reglas:** Solo usuarios validados pueden comentar; existe moderación automática para palabras prohibidas.



### D. Repositorio de Apuntes

* 
**Gestión:** Subida de archivos, versionado, seguridad/compresión y vista previa.


* 
**Etiquetado:** Por materia, profesor, carrera y semestre.


* 
**Flujo de Moderación:** Todo archivo subido queda en estado "pendiente" hasta que un moderador lo aprueba, momento en el que se habilitan las descargas para el autor.



### E. Pizarra de Consejos y Web Scraping

* 
**Tips:** Espacio para publicar, votar y comentar recomendaciones sobre horarios, dificultad de materias y elección de profesores.


* 
**Scraper:** Proceso programado (cron) que extrae datos de la página de horarios de la UASLP para normalizar la información de profesores y grupos por semestre.
