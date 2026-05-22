# CourseLife: Guía de Implementación y Uso

## Overview

**CourseLife** es un sistema completo que transforma datos educativos sin procesar en narrativas memorables, capturando la evolución integral de estudiantes y cursos a lo largo de un año académico.

## Arquitectura de Datos

### 3 Momentos Clave (Google Forms)

El sistema captura información en tres momentos estratégicos:

1. **Inicio III Medio (Marzo)** 📋
   - Diagnóstico inicial
   - Autopercepciones, fortalezas, miedos
   - Primeras expresiones vocacionales
   - Datos: personal, académico, social, espiritual, futuro

2. **Mediados III Medio (Junio)** ⚡
   - Checkpoint a mitad de camino
   - Cambios percibidos y descubrimientos
   - Evolución relacional
   - Datos: académico, social, emocional, vocacional

3. **Inicio IV Medio (Septiembre)** 🎯
   - Reflexión y consolidación
   - Claridad vocacional final
   - Perspectiva sobre la transformación
   - Datos: académico, vocacional, espiritual, futuro

### Modelo de Datos

```typescript
FormResponse {
  id: string;
  formType: 'inicio_III_medio' | 'mediados_III_medio' | 'inicio_IV_medio';
  timestamp: ISO8601;
  year: number;
  email: string;
  rut: string;
  responses: {
    personal?: PersonalData;
    academic?: AcademicData;
    social?: SocialData;
    personal_traits?: PersonalTraitsData;
    emotional?: EmotionalData;
    family?: FamilyData;
    spiritual?: SpiritualData;
    future?: FutureData;
  };
}
```

## Flujo de Usuario

### 1. Importar Formularios (Dashboard → Importar Formularios)

**Interfaz:** `ImportForms.tsx`
- Drag-and-drop multi-archivo para 3 CSVs
- Validación de formato CSV (exportado desde Google Forms)
- Mapeo automático de columnas a estructura de datos
- Importación batch a Firestore bajo `students/{studentId}/formResponses/{id}`

**Endpoint:** `POST /api/import/forms-batch`
```json
{
  "courseId": "course-1",
  "inicio_III_medioFile": <File>,
  "mediados_III_medioFile": <File>,
  "inicio_IV_medioFile": <File>
}
```

### 2. Visualizar Narrativa del Curso (Dashboard → Narrativa del Curso)

**Página:** `CourseLife.tsx`
- Vista dashboard con métricas agregadas
- Narrativa de grupo (humanizada, con IA)
- Historias destacadas de estudiantes
- Exportación a libro digital

**Componente:** `CourseNarrative.tsx`
- Genera automáticamente insights sobre cohesión, liderazgo
- Muestra narrativa IA si está disponible
- Fallback a narrativa template si no hay IA

**IA Generación:**
- Endpoint: `POST /api/generate/course-narrative`
- Input: Todos los formResponses del curso
- Output: Narrativa 400-600 palabras (Spanish)
- Almacenamiento: `courses/{courseId}/narrative`

### 3. Perfil Individual del Estudiante (Students → Ver Perfil)

**Página:** `StudentLife.tsx`
- Timeline de 3 momentos
- Cambios emocionales, académicos, vocacionales
- Insights de crecimiento
- Libro digital personalizado

**Componente:** `StudentJourney.tsx`
- Timeline visual con momentos
- Tarjetas de datos por momento
- Comparativas de cambio
- Botón para generar narrativa IA

**IA Generación:**
- Endpoint: `POST /api/generate/student-narrative`
- Input: FormResponses del estudiante (≥2)
- Output: Narrativa 300-500 palabras (Spanish)
- Almacenamiento: `students/{studentId}/narratives/journey`

### 4. Exportar a Libro Digital

**Componente:** `DigitalBook.tsx`
- Preview en iframe con CSS estético
- Descarga como HTML
- Impresión a PDF (via navegador)
- Copia de código HTML al portapapeles

**Templado:** Portada de gradiente, contenido fluyente, footer con metadata

## Endpoints de Backend

### 1. POST /api/import/forms-batch

Importa 3 CSVs de Google Forms en una sola transacción.

**Request:**
```
multipart/form-data
- courseId: string
- inicio_III_medioFile: File
- mediados_III_medioFile: File (opcional)
- inicio_IV_medioFile: File (opcional)
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "formType": "inicio_III_medio",
      "totalRows": 35,
      "imported": 33,
      "failed": 2,
      "errors": [
        {
          "row": 5,
          "email": "invalid@test.com",
          "reason": "Student not found in course"
        }
      ]
    }
  ],
  "summary": {
    "totalImported": 99,
    "totalFailed": 3
  }
}
```

### 2. POST /api/generate/student-narrative

Genera narrativa IA para un estudiante.

**Request:**
```json
{
  "studentId": "student-123",
  "studentName": "María González",
  "formResponses": [
    { formType, responses, ... },
    { formType, responses, ... },
    { formType, responses, ... }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "narrative": "María llegó a tercero medio como una estudiante...",
  "studentName": "María González",
  "studentId": "student-123"
}
```

### 3. POST /api/generate/course-narrative

Genera narrativa colectiva del curso.

**Request:**
```json
{
  "courseId": "course-1",
  "courseName": "3° Medio A",
  "studentCount": 35,
  "allFormResponses": [...]
}
```

**Response:**
```json
{
  "success": true,
  "narrative": "3° Medio A es un viaje colectivo de 35 estudiantes...",
  "courseName": "3° Medio A",
  "courseId": "course-1",
  "stats": {
    "studentCount": 35,
    "formResponseCount": 105,
    "academicDataPoints": 103,
    "emotionalDataPoints": 98,
    "vocationalDataPoints": 94
  }
}
```

## Componentes UI

### StudentJourney
- **Props:** `studentId`, `studentName`, `formResponses`, `onExport`
- **Render:** Timeline + Quick Stats + Moment Cards
- **Features:** AI narrative generation button

### CourseNarrative
- **Props:** `courseId`, `courseName`, `students`, `stats`, `allFormResponses`, `onExportBook`
- **Render:** Header + Metrics Grid + Narrative Section + Highlights + Insights
- **Features:** AI narrative generation button, dynamic content display

### StudentJourney
- **Props:** `courseName`, `courseYear`, `studentName`, `content`, `type`, `onExport`
- **Render:** Toolbar + HTML Preview + Info
- **Features:** Download HTML, Print PDF, Copy to Clipboard

### ImportForms
- **Render:** Multi-file upload grid (3 dropzones)
- **Features:** Drag-and-drop, progress tracking, error reporting

## Configuración de IA

### DeepSeek API
```typescript
const ai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

// Modelo: deepseek-chat
// Temperature: 0.7 (balanceado entre creatividad y coherencia)
// Max Tokens: 1000 (student), 1500 (course)
```

### Prompts
- Bilingües (instrucciones en Inglés, respuesta esperada en Español)
- Narrativo y emocional, no técnico
- Enfoque en transformación y crecimiento
- Contexto específico del estudiante/curso

## Firestore Collections

```
courses/{courseId}/
  ├─ name: string
  ├─ year: number
  ├─ narrative: string (IA-generated)
  └─ narrativeGeneratedAt: timestamp

students/{studentId}/
  ├─ formResponses/{responseId}/
  │  ├─ formType: string
  │  ├─ timestamp: ISO8601
  │  └─ responses: {...}
  └─ narratives/
     └─ journey: {
        narrative: string,
        generatedAt: timestamp,
        formCount: number
     }
```

## Flujo Técnico Completo

1. **Profesor descarga CSVs** de Google Forms (3 archivos)
2. **Accede a ImportForms** y carga los 3 archivos
3. **Sistema valida** y mapea columnas a estructura FormResponse
4. **Guarda en Firestore** bajo `students/{id}/formResponses/{id}`
5. **Profesor navega a CourseLife o StudentLife**
6. **Sistema carga formResponses** desde Firestore
7. **Profesor opcionalmente genera narrativas IA**
8. **Sistema llama DeepSeek API** con contexto estudiante/curso
9. **Narrativas se persisten** en Firestore
10. **Profesor exporta como libro digital** (HTML/PDF)

## Performance Considerations

- **CSV Parsing:** Batch processing en servidor (streaming posible para archivos grandes)
- **IA Calls:** Parallelizable (generar múltiples narrativas simultáneamente)
- **Firestore:** Batch writes para importación (evitar writes throttling)
- **Narrativas:** Cacheadas en Firestore (no re-generar sin cambios)

## Próximas Mejoras

1. **Comparación Interanual:** Análisis de cursos año a año
2. **Predicción Vocacional:** ML model para sugerir carreras basado en patrones
3. **Generador de Reportes:** PDF con diseño personalizado (no solo HTML)
4. **Dashboard de Padres:** Versión simplificada para apoderados
5. **Integración SSO:** Conectar con sistemas SIS escolares
6. **Análisis de Tendencias:** Visualizaciones de cambios agregados
7. **Feedback Loop:** Validación de narrativas IA por profesor

## Troubleshooting

### Las narrativas no se generan
- Verificar `DEEPSEEK_API_KEY` está seteada
- Revisar logs del servidor para errores de API
- Confirmar que hay ≥2 formResponses disponibles

### CSV no se importa
- Exportar desde Google Forms con encoding UTF-8
- Confirmar que emails de estudiantes existen en base
- Revisar que courseId coincida con estudiantes

### Firestore permission errors
- Actualizar security rules con colecciones `formResponses` y `narratives`
- Verificar que servicio cuenta tiene permisos de escritura

## Conclusión

CourseLife transforma el concepto de registro educativo. Ya no es una hoja de cálculo impersonal, sino una **narrativa viva** que captura la esencia y evolución de estudiantes y cursos, creando recuerdos duraderos y significativos.
