# PULSO.cl Sociogram Integration & Multi-Year Visualization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded sociogram data with real PULSO.cl relational data, implement multi-year storage (2025, 2026+), and enable year-over-year comparison of course dynamics.

**Architecture:** Two parallel projects: (1) PULSO.cl PDF parser + Firestore importer, (2) Sociogram visualization overhaul with real data and multi-year selector.

**Tech Stack:** 
- Frontend: React, Cytoscape.js, Firestore real-time listeners
- Backend: Express.js, PDF parser (`pdfjs-dist` or `pdf-parse`)
- Database: Firestore collections `sociogram_2025/`, `sociogram_2026/`, etc.

---

## Data Architecture

### Firestore Collections

**Structure per year:**
```
sociogram_2025/
  └─ courseId: {
       year: 2025,
       courseId: "default-course",
       
       estudiantes: [
         {
           id: "student-123",
           nombre: "González Valdés Nicolás",
           rol: "Líder Positivo" | "Saludable" | "Desafío" | "No responde",
           autoreporte: {
             bienestar_general: 5,
             aprendizaje: 5,
             relaciones_interpersonales: 5,
             autogestion_academica: 5,
             inclusion: 5
           },
           menciones_positivas: {
             relaciones_compartir: 3,
             relaciones_trabajar: 0,
             ayuda_demas: 2,
             valor_respeto: 1,
             valor_vocacion: 1,
             valor_sencillez: 1,
             valor_espiritu_comunitario: 1,
             valor_responsabilidad: 2,
             valor_verdad: 1,
             liderazgo: 6,
             trata_bien_incluye: 1,
             resuelve_conflictos: 1,
             total: 21
           },
           menciones_negativas: {
             relaciones_negativas_compartir: 0,
             siente_solo: 0,
             pasandolo_mal: 0,
             relaciones_negativas_trabajar: 0,
             molesta_otros: 0,
             // ... other negative mentions
             total: 0
           },
           comentarios: {
             positivos: "Mc Intosh Romero Clemente es muy chistoso",
             negativos: null
           }
         }
       ],
       
       relaciones: [
         {
           from_id: "student-123",
           to_id: "student-456",
           tipo: "trabajo_positivo" | "convivencia_positiva" | "trabajo_negativo" | "convivencia_negativa",
           fuerza: 1 // 1-3: number of mentions supporting this relation
         }
       ],
       
       metricas: {
         cohesion: 6.8,           // % of actual connections / possible connections * 10
         fragmentacion: 40,        // % of students with 0 connections
         liderazgo_promedio: 2.5, // average positive mentions
         aislamiento_promedio: 15  // % of students with 0 positive mentions
       }
     }

sociogram_2026/
  └─ courseId: { ... }
```

---

## PROJECT 1: PULSO.cl Data Import System

### Objective
Parse PULSO.cl PDFs (group report + individual report) → extract structured data → save to Firestore by year

### Files to Create/Modify

**New files:**
- `src/lib/pulsoParser.ts` — PDF parsing logic
- `src/pages/ImportSociogram.tsx` — UI for uploading PDFs and configuring year/course
- `server.ts` — New endpoint `/api/import/sociogram` to handle file upload, parsing, Firestore save

### Import Flow

1. User navigates to "Importar Sociograma" section
2. Uploads **group PDF** (e.g., "Reporte Sociograma 2025 - Curso - III° C TABOR.pdf")
   - Contains: Summary table with all students, relation columns (trabajo positivo, convivencia positiva, etc.)
3. Uploads **individual PDF** (e.g., "Reporte Sociograma 2025 - Individual - III° C TABOR.pdf")
   - Contains: Multiple student sections (variable pages per student, separated by student name)
4. Selects year (2025, 2026, etc.) and courseId
5. App parses:
   - **Group PDF**: Table → names, relation types (columns), counts in cells
   - **Individual PDF**: For each student (identified by name):
     - Autoreporte (numbers 1-5)
     - Menciones positivas (counts per type)
     - Menciones negativas (counts per type)
     - Rol (Líder Positivo, Desafío, No responde)
     - Comentarios (text)
6. Validates student names match between files
7. Constructs relation edges by matching names across files
8. Calculates metrics from data
9. Saves to `sociogram_[YEAR]/courseId`

### PDF Parsing Strategy

**Group PDF:**
1. Extract all text
2. Find table structure (students in rows, relation types in columns)
3. Read cell values (numbers = count of that relation type)
4. Map column headers to relation types

**Individual PDF:**
1. Extract all text
2. Search for student names (use names from group PDF as anchors)
3. For each name found, extract all content from that name until next name appears
4. Parse that section:
   - Autoreporte: Extract 5 numbers (1-5 scale)
   - Menciones: Count occurrences of each mention category
   - Rol: Read status badge text
   - Comentarios: Extract comment text blocks

### Relation Building

After parsing both PDFs:
1. Group PDF provides counts: "González mentions Jordán 3 times in trabajo_positivo"
2. Individual PDFs provide confirmation: Check if both students mention each other
3. Create edges: 
   - `from: González, to: Jordán, tipo: trabajo_positivo, fuerza: 3`

### Validation

- All student names in individual PDF exist in group PDF
- No duplicate students
- Relation counts are positive integers
- Year and courseId are provided

### UI: ImportSociogram Component

**Form fields:**
- File upload: "Reporte grupal (PDF)" - required
- File upload: "Reporte individual (PDF)" - required
- Select: Year (2025, 2026, etc.) - dropdown
- Select: Course - dropdown (list of courses from Firestore)
- Status display: "Parsing...", errors, success message
- Buttons: "Importar", "Cancelar"

**Feedback:**
- Progress bar: "Parsing PDFs... Extracting students... Validating... Saving..."
- Success: "Sociograma 2025 importado: 28 estudiantes, 145 relaciones"
- Errors: "Error: Student 'Juan Pérez' in individual but not in group. Skip/retry?"

---

## PROJECT 2: Sociogram Visualization Overhaul

### Objective
Replace hardcoded sociogram with real PULSO.cl data, dynamic metrics, multi-year selector, and year-over-year comparison

### Files to Modify

**Main:**
- `src/pages/Sociogram.tsx` — Complete rewrite

**New:**
- `src/lib/sociogramMetrics.ts` — Functions to calculate cohesion, fragmentation, leadership, isolation
- `src/components/YearSelector.tsx` — Year selector (2025, 2026) as sticky tab bar

### Current State → New State

**Before:**
```typescript
// Hardcoded random relations
for (let i = 0; i < students.length; i++) {
  const targetIndex = (i + 1) % students.length;
  elements.push({
    data: { 
      id: `e${i}-${targetIndex}`, 
      source: students[i].id, 
      target: students[targetIndex].id,
      type: Math.random() > 0.8 ? 'tension' : 'positive' // ❌ RANDOM
    }
  });
}
// Hardcoded metrics: 6.8/10 cohesion, 40% fragmentation
<span>6.8/10</span> // ❌ STATIC
<span>40%</span>
```

**After:**
```typescript
// Real data from Firestore
const [selectedYear, setSelectedYear] = useState<2025 | 2026>(2025);
const [sociogramData, setSociogramData] = useState(null);

useEffect(() => {
  const docRef = doc(db, `sociogram_${selectedYear}`, courseId);
  const unsubscribe = onSnapshot(docRef, (doc) => {
    setSociogramData(doc.data());
  });
  return () => unsubscribe();
}, [selectedYear]);

// Real relations from data
const estudiantes = sociogramData?.estudiantes || [];
const relaciones = sociogramData?.relaciones || [];

const elements = estudiantes.map(e => ({
  data: { 
    id: e.id, 
    label: e.nombre.split(' ')[0],
    role: e.rol // Real role from PULSO.cl
  }
}));

relaciones.forEach(rel => {
  elements.push({
    data: { 
      id: `e${rel.from_id}-${rel.to_id}`, 
      source: rel.from_id, 
      target: rel.to_id,
      type: rel.tipo, // trabajo_positivo, convivencia_positiva, etc.
      fuerza: rel.fuerza // 1-3
    }
  });
});

// Dynamic metrics
const metricas = sociogramData?.metricas || calculateMetrics(sociogramData);
<span>{metricas.cohesion.toFixed(1)}/10</span> // ✅ DYNAMIC
<span>{metricas.fragmentacion.toFixed(0)}%</span>
```

### Cytoscape Styling

**Edge colors and styles:**
```typescript
{
  selector: 'edge',
  style: {
    'line-color': (ele) => {
      const tipo = ele.data('tipo');
      if (tipo === 'trabajo_positivo') return '#10b981';      // green
      if (tipo === 'convivencia_positiva') return '#3b82f6';  // blue
      if (tipo === 'trabajo_negativo') return '#ef4444';      // red
      if (tipo === 'convivencia_negativa') return '#dc2626';  // dark red
      return '#666';
    },
    'line-style': (ele) => {
      // Dashed for convivencia, solid for trabajo
      return ele.data('tipo').includes('convivencia') ? 'dashed' : 'solid';
    },
    'width': (ele) => {
      // Thickness by mention strength (1-3 → 2-5px)
      return ele.data('fuerza') * 1.5;
    },
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'opacity': 0.7
  }
}
```

**Node colors (by role):**
```typescript
'border-color': (ele) => {
  const role = ele.data('role');
  if (role === 'Líder Positivo') return '#10b981';      // bright green
  if (role === 'Saludable') return '#8b5cf6';           // purple
  if (role === 'Desafío') return '#ef4444';             // red
  if (role === 'No responde') return '#94a3b8';         // gray
  return '#666';
}
```

### Metrics Calculation

**Function `calculateMetrics(sociogramData)`:**

```typescript
function calculateMetrics(data) {
  const estudiantes = data.estudiantes;
  const relaciones = data.relaciones;
  
  // Cohesion: actual connections / possible connections * 10
  const conexionesReales = relaciones.length;
  const conexionesPosibles = estudiantes.length * (estudiantes.length - 1);
  const cohesion = (conexionesReales / conexionesPosibles) * 10;
  
  // Fragmentation: % of students with 0 connections
  const conectados = new Set(relaciones.flatMap(r => [r.from_id, r.to_id]));
  const aislados = estudiantes.length - conectados.size;
  const fragmentacion = (aislados / estudiantes.length) * 100;
  
  // Average leadership: avg positive mentions per student
  const liderazgoPromedio = estudiantes.reduce((sum, e) => 
    sum + e.menciones_positivas.total, 0) / estudiantes.length;
  
  // Isolation: % of students with 0 positive mentions
  const sinMenciones = estudiantes.filter(e => 
    e.menciones_positivas.total === 0).length;
  const aislamientoPromedio = (sinMenciones / estudiantes.length) * 100;
  
  return { cohesion, fragmentacion, liderazgoPromedio, aislamientoPromedio };
}
```

### UI Layout

**Sticky Header:**
- Left: "Inteligencia Relacional" title + description
- Right: Year selector tabs ("2025", "2026") + refresh button + info button

**Left Sidebar (floating):**
- "Salud del Curso" card:
  - Cohesión: X.X/10 (with progress bar)
  - Fragmentación: X% (with progress bar)
  - Liderazgo promedio: X menciones
  - Aislamiento: X%

- "Leyenda" card:
  - Línea verde sólida = Trabajo positivo
  - Línea azul punteada = Convivencia positiva
  - Línea roja sólida = Trabajo negativo
  - Nodo verde = Líder Positivo
  - Nodo morado = Saludable
  - Nodo rojo = Desafío
  - Nodo gris = No responde

**Center:**
- Cytoscape graph container (full size)
- Grid background pattern (same as current)

### Interactivity

**Node hover:**
- Show tooltip with:
  - Name
  - Role
  - Total positive mentions
  - Total negative mentions
  - Autoreporte (bienestar, aprendizaje, etc. as mini bars)

**Edge hover:**
- Show: "Work relation, strength 3" or "Positive coexistence"

**Optional filters (top right buttons):**
- "Show only work relations" (hide convivencia)
- "Show only positive" (hide negatives)
- "Show only leaders" (filter nodes by role)

### Multi-Year Comparison

**"Compare Years" button (top right, near year selector):**

Option A: Side-by-side graphs
- Left: 2025 sociogram
- Right: 2026 sociogram
- Shows visual diff of changes

Option B: Change metrics
- Cohesion: 6.8 → 7.2 (📈 +4%)
- Fragmentation: 40% → 35% (📉 -5%)
- Leadership avg: 2.5 → 2.8 (📈 +12%)
- Isolation: 15% → 10% (📉 -33%)

**Recommendation:** Option B (simpler, more actionable)

### No Data State

If no sociogram data for selected year:
```
"No hay datos de sociograma para 2025. 
Importa un reporte de PULSO.cl desde la sección 'Importar'."
```

---

## Implementation Dependencies

**Projekt 1 must complete before:**
- `sociogram_2025/` collection exists with real data

**Project 2 can start in parallel:**
- Uses mock/sample data initially if needed
- Switches to real data once Project 1 delivers

**No dependencies between projects after Project 1 data structure is locked.**

---

## Testing Plan

### Project 1
1. Upload sample PDFs (group + individual)
2. Verify Firestore structure matches schema
3. Validate all students parsed
4. Verify relations extracted correctly
5. Check metrics calculations

### Project 2
1. Load sociogram for year with data
2. Verify graph renders (nodes visible, edges connected)
3. Hover nodes/edges → tooltips show correct data
4. Change year → graph updates in real-time
5. Compare metrics: 2025 vs 2026 → shows changes
6. Test empty year → shows "no data" message

---

## Files Summary

| File | Type | Change |
|------|------|--------|
| `src/lib/pulsoParser.ts` | New | PDF parsing logic |
| `src/pages/ImportSociogram.tsx` | New | Import UI |
| `server.ts` | Modify | Add `/api/import/sociogram` endpoint |
| `src/pages/Sociogram.tsx` | Modify | Complete rewrite with real data |
| `src/lib/sociogramMetrics.ts` | New | Metric calculations |
| `src/components/YearSelector.tsx` | New | Year switcher |

---
