# Resumen de Implementación - ClassSphere

ClassSphere es un asistente virtual para la **gestión integral de cursos**, diseñado para centralizar información académica, relacional y emocional.

## 1. Arquitectura del Sistema

El sistema utiliza una arquitectura **Full-Stack (Express + React)** para garantizar la seguridad de las APIs de inteligencia artificial y la escalabilidad del frontend.

- **Frontend:** React 18, Vite, Tailwind CSS 4.
- **Backend:** Express.js corriendo en Node.js (vía `tsx` en desarrollo y `esbuild` para producción).
- **Base de Datos:** Firebase Firestore (NoSQL).
- **Autenticación:** Firebase Authentication (Google Login).
- **IA:** Google Gemini 1.5 Flash (integrado en el servidor).

## 2. Configuración de Base de Datos (Firestore)

Se ha implementado un esquema basado en el archivo `firebase-blueprint.json`:

### Colecciones Principales:
- `courses`: Información general del curso y puntajes de salud (health scores).
- `students`: Ficha completa del estudiante (Nombre, RUT, Diagnósticos, Situación Familiar, Nivel de Riesgo).
- `observations`: Notas narrativas del profesor sobre el desempeño o comportamiento.
- `conflicts`: Registro de incidentes entre estudiantes, severidad y estado de resolución.
- `agreements`: Compromisos con fechas de vencimiento y seguimiento.

### Reglas de Seguridad (`firestore.rules`):
- Los usuarios deben estar autenticados para leer o escribir.
- Validación estricta de IDs y estructuras de datos para evitar "shadow fields".
- Control de acceso por `teacherId` para proteger la privacidad de los cursos.

## 3. Conexión Frontend-Backend

La comunicación se divide en dos canales:

### A. Datos de Negocio (Directo a Firestore)
El frontend utiliza el SDK de Firebase para operaciones CRUD en tiempo real (módulos de estudiantes, conflictos, etc.). Esto permite una interfaz reactiva (vía `onSnapshot`).

### B. Funciones Inteligentes (Proxy vía API Server)
Para proteger la `GEMINI_API_KEY`, todas las llamadas a la IA pasan por el servidor Express:
- `POST /api/ai/analyze-risk`: Envía datos del estudiante y el modelo Gemini devuelve una evaluación JSON.
- `POST /api/ai/generate-report`: Sintetiza toda la data del curso en un reporte profesional en Markdown.

## 4. Características Implementadas

1. **Dashboard Inteligente:** Visualización de métricas de salud (Académica, Relacional, Emocional) y alertas de prioridad.
2. **Directorio de Estudiantes:** Gestión de perfiles con evaluación de riesgo asistida por IA.
3. **Sociograma Relacional:** Mapeo visual interactivo (usando Cytoscape.js) para detectar líderes, estudiantes aislados y focos de tensión.
4. **Registro de Conflictos:** Sistema de seguimiento táctico de incidentes desde el reporte hasta la resolución.
5. **Reportes de IA:** Generación instantánea de resúmenes ejecutivos para directivos o apoderados.

## 5. Tecnologías Clave Utilizadas
- **UI/UX:** Lucide React (iconos), Space Grotesk (tipografía display), Inter (interfaz).
- **Visualización:** Recharts (gráficos de dashboard), Cytoscape.js (sociograma).
- **Backend Build:** Esbuild para empaquetado `dist/server.cjs`.
