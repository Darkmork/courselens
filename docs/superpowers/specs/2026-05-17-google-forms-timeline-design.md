# Google Forms Timeline de Crecimiento de Estudiantes - Diseño

## Objetivo

Integrar datos de 3 Google Forms completados en diferentes momentos del año (inicio III medio, fin I semestre, inicio IV medio) para crear un timeline visual del crecimiento de cada estudiante y generar narrativas de crecimiento bajo demanda del profesor.

## Contexto

ClassSphere captura datos académicos, relacionales y emocionales de estudiantes. Actualmente no hay forma de visualizar su evolución en el tiempo. Los profesores tienen 3 Google Forms con información estructurada que necesita integrarse para crear perfiles narrativos del crecimiento de cada alumno.

---

## Arquitectura de Datos

### Estructura Firestore

**Nueva sub-colección:** `students/{studentId}/formResponses/`

Cada documento representa una respuesta de formulario en un momento específico:

```typescript
interface FormResponse {
  id: string;
  formType: "inicio_III_medio" | "fin_I_semestre" | "inicio_IV_medio";
  timestamp: string; // ISO 8601
  year: number;
  email: string; // Para validación
  rut: string; // Identificador alternativo
  responses: {
    personal?: {
      edad?: number;
      familiares?: string; // "Con quién vives"
      hermanos?: number;
      posicion_familiar?: "Mayor" | "Menor" | "Medio";
      padres_ocupacion?: string;
    };
    academic?: {
      desempeño?: string; // Enum
      asignaturas_fuertes?: string[];
      asignaturas_debiles?: string[];
      estrategias_estudio?: string;
      nem_promedio?: number;
      paes_preparacion?: number; // 1-10
      carrera_opcion?: string;
      universidad?: string;
    };
    social?: {
      relacion_compañeros?: string;
      mejores_amigos?: string[];
      participacion_actividades?: string[];
      conflictos?: string;
      pertenencia_grupo?: boolean;
    };
    personal_traits?: {
      habilidades?: string[];
      intereses?: string[];
      deporte_arte?: string;
      personalidad_respuestas?: Record<string, boolean>; // Sí/No questions
      como_amigos_definen?: string;
      como_se_define?: string;
    };
    emotional?: {
      bienestar?: string;
      estres?: string;
      confianza?: number; // 1-10
      autoestima?: number; // 1-10
      orgullo?: string;
      equilibrio?: boolean;
    };
    family?: {
      relacion_familia?: string;
      admira_familiar?: string;
      cambios_deseados?: string;
      apoyo_recibido?: string;
    };
    spiritual?: {
      importancia_fe?: string;
      iglesia?: boolean;
      reza?: boolean;
      influencia_fe?: string;
      identidad_colegio?: string;
      compromiso_social?: string;
    };
    future?: {
      carrera_opcion?: string;
      universidad?: string;
      planes?: string;
      miedos?: string;
      presion_familiar?: boolean;
      vida_10_años?: string;
      consejo_a_ti_mismo?: string;
    };
  };
  createdAt: string;
}
```

### Mapeo de Campos

Los campos de cada formulario se mapean automáticamente a las categorías anteriores durante la importación CSV.

---

## Flujo de Importación (CSV Manual - Fase 1)

### Interfaz: "Importar Formularios"

Nueva sección en el dashboard de profesor.

**Pasos:**
1. **Seleccionar archivo CSV** - Exportado desde Google Forms
2. **Seleccionar tipo de formulario** - Dropdown: Inicio III Medio / Fin I Semestre / Inicio IV Medio
3. **Validación automática:**
   - Email presente en cada fila
   - Email existe en colección `students`
   - RUT coincide (si está disponible)
4. **Preview de mapeo** - Mostrar qué estudiantes se van a actualizar
5. **Confirmar importación** - Crea/actualiza documentos en formResponses
6. **Reporte de resultado** - N estudiantes importados, X errores, Y duplicados

**Validación:**
- Si email no existe en students: Mostrar error, no importar esa fila
- Si estudiante ya tiene ese formulario (mismo type): Opción de sobrescribir
- Campos vacíos: Se permiten (quedan como undefined)

---

## Visualización: Tab "Crecimiento"

**Ubicación:** En perfil del estudiante, nuevo tab "Crecimiento" (junto a "Personal", "Académico", etc.)

**Estructura:**

### Vista 1: Timeline Vertical (Por Defecto)

Mostrar los 3 momentos en orden cronológico:

```
┌─ INICIO III MEDIO (Marzo 2025) ──────────────┐
│ [Card Colapsable] Personal                   │
│ [Card Colapsable] Académico                  │
│ [Card Colapsable] Social                     │
│ [Card Colapsable] Personal Traits            │
│ ... (todos los temas)                        │
└──────────────────────────────────────────────┘

┌─ FIN I SEMESTRE (Junio 2025) ─────────────────┐
│ [Card Colapsable] Académico                  │
│ ... (solo temas con datos)                    │
└──────────────────────────────────────────────┘

┌─ INICIO IV MEDIO (Agosto 2025) ────────────────┐
│ [Card Colapsable] Académico                  │
│ ... (solo temas con datos)                    │
└──────────────────────────────────────────────┘
```

**Cada Card colapsable:**
- **Título:** Tema (ej: "Académico")
- **Resumen:** 1-2 líneas de lo más relevante
- **Click para expandir:** Muestra todos los campos del tema en formato key-value
- **Indicador de cambio:** ↑ (mejoró), ↓ (empeoró), = (igual) basado en comparativa con período anterior

### Vista 2: Comparativas Lado a Lado (Toggle)

Toggle "Mostrar Comparativas" en el header del tab.

Muestra tabla comparativa entre primer y último formulario:

```
TEMA: ACADÉMICO
┌────────────────────────────────┬────────────────────────────────┐
│ INICIO III MEDIO (Marzo 2025)  │ INICIO IV MEDIO (Agosto 2025)  │
├────────────────────────────────┼────────────────────────────────┤
│ Desempeño: Bajo                │ Desempeño: Promedio  [↑ Mejoró]│
│ Fuerte: Lenguaje               │ Fuerte: Matemáticas  [↑ Cambio]│
│ Débil: Ciencias                │ Débil: Historia      [↔ Igual] │
│ Estrategias: Pocas             │ Estrategias: Muchas  [↑ Cambio]│
└────────────────────────────────┴────────────────────────────────┘
```

Muestra cambios detectados automáticamente entre período 1 y período 3.

---

## Generación de Relatos (Bajo Demanda)

**Botón:** "Generar Relato de Crecimiento" (en header del tab Crecimiento)

**Flujo:**
1. Click en botón → Modal de confirmación
2. Recopila todos los datos de formResponses del estudiante
3. Envía a DeepSeek con prompt específico
4. Muestra narrativa en modal
5. Opciones: Copiar, Exportar a PDF, Descargar como .docx

**Prompt para DeepSeek:**

```
Eres un psicólogo educativo especializado en reportes de desarrollo de adolescentes.

Basándote en estos datos de [Nombre] capturados en 3 momentos diferentes del año escolar:
- INICIO III MEDIO (Marzo): {datos}
- FIN I SEMESTRE (Junio): {datos}
- INICIO IV MEDIO (Agosto): {datos}

Crea un RELATO NARRATIVO que:
1. Describe la evolución y crecimiento del estudiante
2. Destaca cambios significativos (positivos y desafíos)
3. Conecta datos académicos, sociales, emocionales y personales
4. Identifica patrones de crecimiento
5. Proyecta hacia el futuro basándote en los datos

Requisitos:
- Tono: Cálido, reflexivo, empoderador
- Lenguaje: Español, académico pero accesible
- Extensión: 250-400 palabras
- Estructura: Introducción → Desarrollo → Reflexión
- Incluye citas o datos específicos del formulario
```

**Manejo de errores:**
- Si no hay suficientes formularios (menos de 2): Mensaje "Se necesitan al menos 2 formularios para generar relato"
- Si DeepSeek falla: Mostrar error y opción de reintentar

---

## Interfaz y Componentes

### Nueva Página/Tab: Students > [StudentId] > "Crecimiento"

**Header:**
```
[← Volver] CRECIMIENTO | [Comparativas Toggle] [Generar Relato Btn]
[Filtro por Tema dropdown - opcional]
```

**Body:**
- Timeline con cards colapsables (por defecto)
- O tabla comparativa (si toggle activado)

**Estructura de Card:**
```
┌─ ACADÉMICO ────────────────────────────┐
│ [↓ Expandir] [↑ Mejoró en comparativa] │
│ Desempeño: Bajo → Promedio             │
│ Estrategias: Pocas → Muchas            │
└────────────────────────────────────────┘
```

---

## Validación de Datos

**Durante importación CSV:**
- Email es requerido
- Email debe coincidir con estudiante existente
- RUT (si presente) debe coincidir
- Campos numéricos: Validar rango (ej: 1-10)
- Enums: Validar contra valores permitidos

**Durante visualización:**
- Si campo no existe en forma: Mostrar "-" o "No disponible"
- Si timestamp es inválido: Log error, skip documento
- Cambios detectados: Comparar campo a campo entre período 1 y 3

---

## Preparación para API (Fase 2 - Futuro)

La arquitectura está preparada para automatizar la importación:
- Google Forms API puede ser integrada sin cambiar la estructura de datos
- Webhook puede disparar importación automática al completar formulario
- Endpoint backend existente para recibir/procesar datos
- Permisos Firestore ya soportan escritura desde backend

---

## Success Criteria

1. ✓ Profesor puede subir CSV y mapear estudiantes automáticamente
2. ✓ Datos se guardan en formResponses subcollections
3. ✓ Tab "Crecimiento" muestra timeline de 3 momentos
4. ✓ Cards colapsables muestran datos sin saturar pantalla
5. ✓ Vista comparativa muestra cambios entre inicio y fin
6. ✓ Botón "Generar Relato" produce narrativa coherente
7. ✓ Indicadores visuales (↑↓=) muestran cambios
8. ✓ Validación previene datos inconsistentes
9. ✓ Errores se reportan claramente al profesor
10. ✓ Relatos son exportables/copiables

