# CourseLife: Plan de Implementación Completo

## Visión
Transformar CourseL​ens en una plataforma que capture "la vida del curso" a través de 3 momentos clave (Inicio III, Mediados III, Inicio IV), creando narrativas memorables tanto a nivel curso como individual.

## Arquitectura de Datos

### 3 Momentos Clave
- **Momento 1: Inicio III Medio** → Diagnóstico baseline
- **Momento 2: Mediados III Medio** → Checkpoint (7 semanas después)
- **Momento 3: Inicio IV Medio** → Consolidación (6 meses después)

### Flujo de Datos
1. Estudiantes responden Google Forms en cada momento
2. Profesor descarga CSV desde Google Forms
3. Importa en plataforma (3 archivos)
4. Sistema genera narrativas IA por estudiante + curso
5. Profesor visualiza dashboards y puede exportar a "libro digital"

## Componentes a Crear

### Frontend
1. **ImportFormsMultiple** - Interfaz drag-and-drop para importar 3 CSVs simultáneamente
2. **StudentJourney** - Timeline visual de evolución del estudiante (3 momentos)
3. **CourseNarrative** - Dashboard de reportaje del curso
4. **DigitalBook** - Preview + exportación a PDF/HTML
5. **StudentProfile** - Vista individual detallada con narrativa

### Backend
1. **POST /api/import/forms-multiple** - Procesar 3 CSVs, mapear a FormResponse
2. **POST /api/generate/student-journey** - IA que crea narrativa de evolución por estudiante
3. **POST /api/generate/course-narrative** - IA que crea narrativa colectiva del curso
4. **GET /api/digital-book/:courseId** - Datos para exportación

### Firestore
- Colecciones existentes: form_responses (ya captura todo)
- Nueva: course_narratives (narrativas del curso)
- Nueva: student_narratives (narrativas individuales)

## Implementación por Fase

### Fase 1: Importación Multi-CSV (2h)
- Crear UI para importar 3 archivos
- Validar que mapeen a los 3 momentos
- Guardar en Firestore

### Fase 2: Generación de Narrativas (2.5h)
- IA para narrativa individual (evolución 3 momentos)
- IA para narrativa del curso (dinámicas colectivas)
- Caching en Firestore

### Fase 3: Visualización Individual (2h)
- StudentJourney component
- Timeline + datos + narrativa
- Estadísticas de cambio (estres ↓, vocación ↑, etc)

### Fase 4: Dashboard Curso (2h)
- CourseNarrative component
- Top insights, patrones, cambios colectivos
- Visualizaciones tipo Recharts

### Fase 5: Libro Digital (1.5h)
- HTML estético templado
- PDF export vía html2pdf
- Preview en navegador

## Orden de Trabajo
1. Backend: importación + almacenamiento
2. Frontend: interfaz de importación
3. IA: generación de narrativas
4. Frontend: StudentJourney
5. Frontend: CourseNarrative
6. Frontend: DigitalBook export

**Tiempo estimado total: ~12 horas**
