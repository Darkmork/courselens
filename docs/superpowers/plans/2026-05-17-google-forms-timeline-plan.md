# Google Forms Timeline Growth Integration - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable teachers to import Google Forms CSV data into Firestore sub-collections and visualize student growth through timeline views, comparatives, and AI-generated narratives.

**Architecture:** Phase 1 implements CSV import with Firestore sub-collections (`students/{id}/formResponses/`), a new "Crecimiento" tab in student profile showing timeline + comparatives, and on-demand DeepSeek narrative generation. Phase 2 (future) will add Google Forms API automation.

**Tech Stack:** TypeScript, React, Firestore sub-collections, Express CSV parsing, DeepSeek API, Tailwind CSS

---

## File Structure

**New files:**
- `src/types/FormResponse.ts` — FormResponse interface definitions
- `src/lib/csvParser.ts` — CSV parsing and validation utilities
- `src/lib/growthNarrative.ts` — DeepSeek integration for narrative generation
- `src/components/StudentGrowthTimeline.tsx` — Main timeline component
- `src/components/FormResponseCard.tsx` — Collapsible card for each form section
- `src/components/GrowthComparative.tsx` — Side-by-side comparison view

**Modified files:**
- `src/types/index.ts` — Add FormResponse import
- `server.ts` — Add POST `/api/import/form-responses` endpoint
- `src/pages/Students.tsx` — Add "Crecimiento" tab in student detail modal

---

## Tasks

### Task 1: Add FormResponse TypeScript Types

**Files:**
- Create: `src/types/FormResponse.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create FormResponse.ts with all interfaces**

```typescript
// src/types/FormResponse.ts

export type FormType = 'inicio_III_medio' | 'fin_I_semestre' | 'inicio_IV_medio';

export interface PersonalData {
  edad?: number;
  familiares?: string;
  hermanos?: number;
  posicion_familiar?: 'Mayor' | 'Menor' | 'Medio';
  padres_ocupacion?: string;
}

export interface AcademicData {
  desempeño?: string;
  asignaturas_fuertes?: string[];
  asignaturas_debiles?: string[];
  estrategias_estudio?: string;
  nem_promedio?: number;
  paes_preparacion?: number;
  carrera_opcion?: string;
  universidad?: string;
}

export interface SocialData {
  relacion_compañeros?: string;
  mejores_amigos?: string[];
  participacion_actividades?: string[];
  conflictos?: string;
  pertenencia_grupo?: boolean;
}

export interface PersonalTraitsData {
  habilidades?: string[];
  intereses?: string[];
  deporte_arte?: string;
  personalidad_respuestas?: Record<string, boolean>;
  como_amigos_definen?: string;
  como_se_define?: string;
}

export interface EmotionalData {
  bienestar?: string;
  estres?: string;
  confianza?: number;
  autoestima?: number;
  orgullo?: string;
  equilibrio?: boolean;
}

export interface FamilyData {
  relacion_familia?: string;
  admira_familiar?: string;
  cambios_deseados?: string;
  apoyo_recibido?: string;
}

export interface SpiritualData {
  importancia_fe?: string;
  iglesia?: boolean;
  reza?: boolean;
  influencia_fe?: string;
  identidad_colegio?: string;
  compromiso_social?: string;
}

export interface FutureData {
  carrera_opcion?: string;
  universidad?: string;
  planes?: string;
  miedos?: string;
  presion_familiar?: boolean;
  vida_10_años?: string;
  consejo_a_ti_mismo?: string;
}

export interface FormResponse {
  id: string;
  formType: FormType;
  timestamp: string; // ISO 8601
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
  createdAt: string;
  updatedAt: string;
}

export interface FormImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; email?: string; reason: string }>;
}
```

- [ ] **Step 2: Update src/types/index.ts to export FormResponse**

```typescript
// At top of src/types/index.ts, add:
export { FormResponse, FormType, PersonalData, AcademicData, SocialData, PersonalTraitsData, EmotionalData, FamilyData, SpiritualData, FutureData, FormImportResult } from './FormResponse';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/FormResponse.ts src/types/index.ts
git commit -m "types: add FormResponse and related interfaces for Google Forms integration"
```

---

### Task 2: Create CSV Parser Utility

**Files:**
- Create: `src/lib/csvParser.ts`

- [ ] **Step 1: Write CSV parser with validation**

```typescript
// src/lib/csvParser.ts
import Papa from 'papaparse';
import { FormResponse, FormType } from '../types/FormResponse';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedCSVData {
  rows: Array<Record<string, string>>;
  headers: string[];
}

export interface ValidatedFormResponse {
  data: FormResponse;
  error?: string;
}

/**
 * Parse CSV file and return raw data with headers
 */
export function parseCSV(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results: any) => {
        const headers = results.data[0] || [];
        const rows = results.data.slice(1).filter((row: any[]) => row.some(cell => cell && cell.trim()));
        resolve({ headers, rows });
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Validate a single row and convert to FormResponse
 */
export function validateAndMapRow(
  row: Record<string, string>,
  formType: FormType,
  rowIndex: number
): ValidatedFormResponse {
  const email = row['Correo electronico'] || row['Correo electrónico'] || row['email'];
  const rut = row['RUT'] || row['rut'] || '';

  if (!email || !email.trim()) {
    return {
      data: {} as FormResponse,
      error: `Row ${rowIndex}: Email is required`,
    };
  }

  const responses = mapCSVRowToResponses(row, formType);

  const formResponse: FormResponse = {
    id: uuidv4(),
    formType,
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear(),
    email: email.trim(),
    rut: rut.trim(),
    responses,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { data: formResponse };
}

/**
 * Map CSV row fields to FormResponse.responses structure based on formType
 */
function mapCSVRowToResponses(row: Record<string, string>, formType: FormType): FormResponse['responses'] {
  const responses: FormResponse['responses'] = {};

  // Common mappings for all forms
  if (formType === 'inicio_III_medio') {
    responses.personal = {
      edad: row['Edad'] ? parseInt(row['Edad']) : undefined,
      familiares: row['¿Con quien vives?'],
      hermanos: row['¿Cuántos Hermanos tienes?'] ? parseInt(row['¿Cuántos Hermanos tienes?']) : undefined,
      posicion_familiar: row['¿Eres el/la mayor, el/la menor o del medio?'] as any,
      padres_ocupacion: row['¿A qué se dedican tus padres o tutores?'],
    };

    responses.family = {
      relacion_familia: row['¿Cómo describirías la relación con tu familia?'],
      admira_familiar: row['¿Tienes algún familiar que admires o consideres un ejemplo?'],
      cambios_deseados: row['¿Hay algo que te gustaría cambiar en la dinámica familiar?'],
    };

    responses.personal_traits = {
      habilidades: row['¿Cuáles crees que son tus mayores habilidades?']?.split(',').map(h => h.trim()),
      intereses: extractSíNoResponses(row, 'preguntas de respuesta sí o no'),
      deporte_arte: row['¿Practicas algún deporte o actividad artística?¿cúal?'],
      como_amigos_definen: row['- ¿Cómo crees que te definirían tus amigos?'],
      como_se_define: row['- ¿Y tú, cómo te defines?'],
    };

    responses.academic = {
      desempeño: row['¿Cómo te fue en el rendimiento académico el año pasado?'],
      asignaturas_fuertes: row['¿Hay alguna asignatura en la que tengas fortalezas y motivaciones?']?.split(',').map(s => s.trim()),
      asignaturas_debiles: row['¿Hay alguna asignatura en la que te presenten dificultades?']?.split(',').map(s => s.trim()),
    };

    responses.spiritual = {
      importancia_fe: row['¿Consideras importante la espiritualidad en tu vida?'],
      iglesia: row['¿Vas a la iglesia o participas en actividades religiosas?']?.toLowerCase() === 'sí',
      reza: row['¿Rezas?']?.toLowerCase() === 'sí',
      influencia_fe: row['¿Cómo influye tu fe en tu forma de relacionarte con los demás?'],
    };

    responses.future = {
      carrera_opcion: row['¿Hay alguna carrera o área de estudio que te llame la atención?'],
      planes: row['¿Tienes algún plan a corto o mediano plazo para trabajar?'],
      consejo_a_ti_mismo: row['¿Qué te gustaría mejorar de ti mismo/a este año?'],
    };
  } else if (formType === 'fin_I_semestre') {
    responses.academic = {
      desempeño: row['¿Cómo evalúas tu desempeño académico este semestre?'],
      asignaturas_fuertes: row['¿En qué asignaturas te sentiste más cómodo/a y por qué?']?.split(',').map(s => s.trim()),
      estrategias_estudio: row['¿Qué estrategias de estudio te funcionaron mejor?'],
    };

    responses.social = {
      relacion_compañeros: row['¿Cómo describirías tu relación con tus compañeros de curso?'],
      participacion_actividades: row['¿Participaste en actividades de curso, comités, talleres u otras?']?.split(',').map(a => a.trim()),
      pertenencia_grupo: row['¿Sientes que formas parte de un grupo o comunidad dentro del colegio?']?.toLowerCase() === 'sí',
      conflictos: row['¿Has tenido algún conflicto este semestre?'],
    };

    responses.emotional = {
      bienestar: row['¿Cómo te sentiste emocionalmente durante este semestre?'],
      estres: row['¿Qué situaciones te generaron más estrés o preocupación?'],
      orgullo: row['¿Qué cosas te hicieron sentir orgulloso/a de ti mismo?'],
      equilibrio: row['¿Lograste un equilibrio entre el estudio, tus intereses personales y el descanso?']?.toLowerCase() === 'sí',
    };
  } else if (formType === 'inicio_IV_medio') {
    responses.academic = {
      nem_promedio: row['¿Cuál es tu promedio general acumulado (NEM) hasta la fecha?'] ? parseFloat(row['¿Cuál es tu promedio general acumulado (NEM) hasta la fecha?']) : undefined,
      paes_preparacion: row['¿Cómo calificarías tu nivel de preparación para la PAES?'] ? parseInt(row['¿Cómo calificarías tu nivel de preparación para la PAES?']) : undefined,
      carrera_opcion: row['¿Cuál es tu primera opción para el próximo año?'],
      universidad: row['¿En qué universidad te proyectas estudiando principalmente?'],
    };

    responses.future = {
      carrera_opcion: row['¿Cuál es tu primera opción para el próximo año?'],
      universidad: row['¿En qué universidad te proyectas estudiando principalmente?'],
      miedos: row['¿Cuál es tu principal temor respecto a la vida universitaria o adulta?'],
      presion_familiar: row['¿Te sientes presionado/a por tu entorno familiar respecto a la elección de tu carrera?']?.toLowerCase() === 'sí',
      vida_10_años: row['¿Dónde te imaginas viviendo en 10 años?'],
    };

    responses.spiritual = {
      importancia_fe: row['¿Cómo describirías tu relación actual con la fe y la Iglesia?'],
      compromiso_social: row['¿Cuál es tu principal temor respecto a la vida universitaria o adulta?'],
    };
  }

  return responses;
}

/**
 * Extract yes/no responses and return as string array
 */
function extractSíNoResponses(row: Record<string, string>, prefix: string): string[] {
  const responses: string[] = [];
  Object.entries(row).forEach(([key, value]) => {
    if (key.includes(prefix) && (value?.toLowerCase() === 'sí' || value?.toLowerCase() === 'yes')) {
      responses.push(key);
    }
  });
  return responses;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/csvParser.ts
git commit -m "feat: add CSV parser and validator for form responses"
```

---

### Task 3: Create Backend Import Endpoint

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add import endpoint to server.ts**

```typescript
// In server.ts, add this endpoint after existing AI endpoints (around line 220):

app.post("/api/import/form-responses", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        error: "Firebase not initialized",
        status: "firebase_not_ready",
      });
    }

    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({
        error: "csvFile is required",
        status: "validation_failed",
      });
    }

    const { formType, courseId } = req.body;
    if (!formType || !courseId) {
      return res.status(400).json({
        error: "formType and courseId are required",
        status: "validation_failed",
      });
    }

    const csvFile = req.files.csvFile as fileUpload.UploadedFile;

    // Parse CSV
    const { parseCSV, validateAndMapRow } = await import("./src/lib/csvParser");
    const Papa = (await import("papaparse")).default;

    let rows: any[] = [];
    let headers: string[] = [];

    await new Promise<void>((resolve, reject) => {
      Papa.parse(csvFile.data.toString(), {
        complete: (results: any) => {
          headers = results.data[0] || [];
          rows = results.data.slice(1).filter((row: any[]) => row.some(cell => cell && cell.trim()));
          resolve();
        },
        error: (error: any) => reject(error),
      });
    });

    // Validate and map rows
    const validatedRows = rows.map((row, index) => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        rowObj[header] = row[colIndex] || "";
      });
      return validateAndMapRow(rowObj, formType, index + 2);
    });

    // Separate valid from invalid
    const validResponses = validatedRows.filter(r => !r.error).map(r => r.data);
    const errors = validatedRows.filter(r => r.error).map((r, index) => ({
      row: index + 2,
      email: rows[index]["Correo electrónico"] || rows[index]["Correo electronico"],
      reason: r.error,
    }));

    // Check student existence and save to Firestore
    let imported = 0;
    const studentErrors: Array<{ row: number; email: string; reason: string }> = [];

    for (let i = 0; i < validResponses.length; i++) {
      const response = validResponses[i];
      
      try {
        // Check if student exists
        const studentQuery = await db
          .collection("students")
          .where("email", "==", response.email)
          .where("courseId", "==", courseId)
          .limit(1)
          .get();

        if (studentQuery.empty) {
          studentErrors.push({
            row: rows.indexOf(rows[i]) + 2,
            email: response.email,
            reason: `Student with email ${response.email} not found in course ${courseId}`,
          });
          continue;
        }

        const studentId = studentQuery.docs[0].id;

        // Save to sub-collection
        await db
          .collection("students")
          .doc(studentId)
          .collection("formResponses")
          .doc(response.id)
          .set(response);

        imported++;
      } catch (error: any) {
        studentErrors.push({
          row: rows.indexOf(rows[i]) + 2,
          email: response.email,
          reason: `Database error: ${error.message}`,
        });
      }
    }

    res.json({
      success: true,
      totalRows: rows.length,
      imported,
      failed: validatedRows.filter(r => r.error).length + studentErrors.length,
      errors: [...errors, ...studentErrors],
    });
  } catch (error: any) {
    console.error("Error importing form responses:", error);
    res.status(500).json({
      error: "Failed to import form responses",
      details: error.message,
      status: "error",
    });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "feat: add POST /api/import/form-responses endpoint for CSV import"
```

---

### Task 4: Create StudentGrowthTimeline Component

**Files:**
- Create: `src/components/StudentGrowthTimeline.tsx`

- [ ] **Step 1: Create main timeline component**

```typescript
// src/components/StudentGrowthTimeline.tsx
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FormResponse } from '../types/FormResponse';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import FormResponseCard from './FormResponseCard';
import GrowthComparative from './GrowthComparative';

interface StudentGrowthTimelineProps {
  studentId: string;
}

export const StudentGrowthTimeline: React.FC<StudentGrowthTimelineProps> = ({ studentId }) => {
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparative, setShowComparative] = useState(false);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);

  // Load form responses
  useEffect(() => {
    const q = query(
      collection(db, 'students', studentId, 'formResponses'),
      where('formType', 'in', ['inicio_III_medio', 'fin_I_semestre', 'inicio_IV_medio'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responses = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FormResponse))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setFormResponses(responses);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  const generateNarrative = async () => {
    setGeneratingNarrative(true);
    try {
      const response = await fetch('/api/ai/generate-growth-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          formResponses,
        }),
      });

      const data = await response.json();
      if (data.narrative) {
        setNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-400">Cargando datos de crecimiento...</div>;
  }

  if (formResponses.length === 0) {
    return (
      <div className="p-6 text-neutral-400 text-center">
        No hay respuestas de formulario registradas para este estudiante.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Timeline de Crecimiento</h3>
          <p className="text-xs text-neutral-400 mt-1">
            {formResponses.length} formulario{formResponses.length !== 1 ? 's' : ''} registrado{formResponses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowComparative(!showComparative)}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-mono border border-blue-500/30 transition-all"
          >
            {showComparative ? 'Timeline' : 'Comparativas'}
          </button>
          <button
            onClick={generateNarrative}
            disabled={generatingNarrative || formResponses.length < 2}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm font-mono border border-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generatingNarrative ? 'Generando...' : 'Relato de IA'}
          </button>
        </div>
      </div>

      {/* Narrative Modal/Section */}
      {narrative && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-white">Relato de Crecimiento</h4>
            <button
              onClick={() => setNarrative(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">{narrative}</p>
          <button
            onClick={() => navigator.clipboard.writeText(narrative)}
            className="mt-4 text-xs px-3 py-2 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
          >
            Copiar
          </button>
        </div>
      )}

      {/* Timeline or Comparative View */}
      {showComparative ? (
        <GrowthComparative responses={formResponses} />
      ) : (
        <div className="space-y-8">
          {formResponses.map(response => (
            <div key={response.id}>
              <div className="text-sm font-mono text-neutral-400 mb-3">
                {new Date(response.timestamp).toLocaleDateString('es-CL')} • {response.formType.replace(/_/g, ' ')}
              </div>
              <div className="space-y-3">
                {Object.entries(response.responses).map(([category, data]) => (
                  data && Object.keys(data).length > 0 && (
                    <FormResponseCard
                      key={category}
                      category={category}
                      data={data}
                      previousData={
                        formResponses.indexOf(response) > 0
                          ? formResponses[formResponses.indexOf(response) - 1].responses[category as keyof typeof response.responses]
                          : undefined
                      }
                    />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentGrowthTimeline;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StudentGrowthTimeline.tsx
git commit -m "feat: create StudentGrowthTimeline component with timeline and narrative"
```

---

### Task 5: Create FormResponseCard Component

**Files:**
- Create: `src/components/FormResponseCard.tsx`

- [ ] **Step 1: Create collapsible card component**

```typescript
// src/components/FormResponseCard.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FormResponseCardProps {
  category: string;
  data: Record<string, any>;
  previousData?: Record<string, any>;
}

export const FormResponseCard: React.FC<FormResponseCardProps> = ({
  category,
  data,
  previousData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (cat: string): string => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      academic: 'bg-green-500/10 border-green-500/30 text-green-300',
      social: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      personal_traits: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
      emotional: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      family: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      spiritual: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      future: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    };
    return colors[cat] || 'bg-neutral-500/10 border-neutral-500/30 text-neutral-300';
  };

  const getChangeIndicator = (key: string): JSX.Element | null => {
    if (!previousData || previousData[key] === undefined) return null;

    const prev = previousData[key];
    const current = data[key];

    if (typeof prev === 'number' && typeof current === 'number') {
      if (current > prev) return <TrendingUp className="w-3 h-3 text-green-400" />;
      if (current < prev) return <TrendingDown className="w-3 h-3 text-red-400" />;
      return <Minus className="w-3 h-3 text-neutral-400" />;
    }

    if (JSON.stringify(prev) !== JSON.stringify(current)) {
      return <Minus className="w-3 h-3 text-yellow-400" />;
    }

    return null;
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value || '');
  };

  const categoryLabel = category.replace(/_/g, ' ');

  return (
    <div className={`border rounded-lg p-4 cursor-pointer transition-all ${getCategoryColor(category)}`}>
      <div
        className="flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm uppercase tracking-wider">{categoryLabel}</span>
          {!isExpanded && (
            <span className="text-xs text-neutral-400">
              ({Object.keys(data).filter(k => data[k]).length} campos)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 pt-4 border-t border-current border-opacity-20">
          {Object.entries(data).map(([key, value]) => (
            value !== undefined && value !== null && value !== '' && (
              <div key={key} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-neutral-300 font-mono">{key.replace(/_/g, ' ')}:</span>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-neutral-200">{formatValue(value)}</span>
                  {getChangeIndicator(key)}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default FormResponseCard;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FormResponseCard.tsx
git commit -m "feat: create FormResponseCard with expandable category display and change indicators"
```

---

### Task 6: Create GrowthComparative Component

**Files:**
- Create: `src/components/GrowthComparative.tsx`

- [ ] **Step 1: Create side-by-side comparison component**

```typescript
// src/components/GrowthComparative.tsx
import React from 'react';
import { FormResponse } from '../types/FormResponse';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GrowthComparativeProps {
  responses: FormResponse[];
}

export const GrowthComparative: React.FC<GrowthComparativeProps> = ({ responses }) => {
  const first = responses[0];
  const last = responses[responses.length - 1];

  if (!first || !last) {
    return <div className="text-neutral-400">No hay datos suficientes para comparar</div>;
  }

  const categories = [
    { key: 'academic', label: 'Académico' },
    { key: 'social', label: 'Social' },
    { key: 'emotional', label: 'Emocional' },
    { key: 'personal', label: 'Personal' },
    { key: 'family', label: 'Familiar' },
    { key: 'spiritual', label: 'Espiritual' },
    { key: 'future', label: 'Futuro' },
  ];

  const getChangeIndicator = (prev: any, current: any) => {
    if (prev === undefined || current === undefined) return null;

    if (typeof prev === 'number' && typeof current === 'number') {
      if (current > prev) return <TrendingUp className="w-3 h-3 text-green-400" title="Mejoró" />;
      if (current < prev) return <TrendingDown className="w-3 h-3 text-red-400" title="Disminuyó" />;
      return <Minus className="w-3 h-3 text-neutral-400" title="Sin cambios" />;
    }

    if (JSON.stringify(prev) !== JSON.stringify(current)) {
      return <span className="text-xs text-yellow-400">●</span>;
    }

    return null;
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value || '—');
  };

  return (
    <div className="space-y-6">
      {categories.map(({ key, label }) => {
        const firstData = first.responses[key as keyof typeof first.responses];
        const lastData = last.responses[key as keyof typeof last.responses];

        if (!firstData && !lastData) return null;

        return (
          <div key={key} className="border border-white/10 rounded-lg overflow-hidden">
            <div className="bg-white/5 px-4 py-3 font-bold text-white text-sm uppercase tracking-wider border-b border-white/10">
              {label}
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10">
              {/* Left side - First response */}
              <div className="p-4 space-y-2">
                <div className="text-xs text-neutral-400 font-mono mb-3">
                  {new Date(first.timestamp).toLocaleDateString('es-CL')}
                </div>
                {firstData ? (
                  Object.entries(firstData).map(([fieldKey, value]) => (
                    value !== undefined && value !== null && (
                      <div key={fieldKey} className="text-xs">
                        <div className="text-neutral-400 font-mono">{fieldKey.replace(/_/g, ' ')}</div>
                        <div className="text-neutral-200">{formatValue(value)}</div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="text-xs text-neutral-500">Sin datos</div>
                )}
              </div>

              {/* Right side - Last response */}
              <div className="p-4 space-y-2">
                <div className="text-xs text-neutral-400 font-mono mb-3">
                  {new Date(last.timestamp).toLocaleDateString('es-CL')}
                </div>
                {lastData ? (
                  Object.entries(lastData).map(([fieldKey, value]) => {
                    const prevValue = firstData?.[fieldKey as keyof typeof firstData];
                    return (
                      value !== undefined && value !== null && (
                        <div key={fieldKey} className="text-xs flex justify-between items-start gap-2">
                          <div>
                            <div className="text-neutral-400 font-mono">{fieldKey.replace(/_/g, ' ')}</div>
                            <div className="text-neutral-200">{formatValue(value)}</div>
                          </div>
                          {getChangeIndicator(prevValue, value)}
                        </div>
                      )
                    );
                  })
                ) : (
                  <div className="text-xs text-neutral-500">Sin datos</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GrowthComparative;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GrowthComparative.tsx
git commit -m "feat: create GrowthComparative component for side-by-side analysis"
```

---

### Task 7: Create Growth Narrative Generation (DeepSeek)

**Files:**
- Create: `src/lib/growthNarrative.ts`
- Modify: `server.ts`

- [ ] **Step 1: Create narrative generation utility**

```typescript
// src/lib/growthNarrative.ts
import { FormResponse } from '../types/FormResponse';

export async function generateGrowthNarrative(formResponses: FormResponse[], studentName: string): Promise<string> {
  // Sort by timestamp
  const sorted = [...formResponses].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Build context from responses
  const context = sorted.map(response => ({
    date: new Date(response.timestamp).toLocaleDateString('es-CL'),
    formType: response.formType.replace(/_/g, ' '),
    data: response.responses,
  }));

  const prompt = buildNarrativePrompt(studentName, context);
  return prompt;
}

function buildNarrativePrompt(studentName: string, context: any[]): string {
  const dataStr = context
    .map(
      ctx => `
**${ctx.formType}** (${ctx.date}):
${JSON.stringify(ctx.data, null, 2)}
`
    )
    .join('\n');

  return `Eres un psicólogo educativo especializado en reportes de desarrollo de adolescentes.

Basándote en estos datos de ${studentName} capturados en diferentes momentos del año escolar:

${dataStr}

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

Comienza el relato directamente sin encabezados.`;
}
```

- [ ] **Step 2: Add narrative endpoint to server.ts**

```typescript
// In server.ts, add this endpoint after the sociogram import endpoint:

app.post("/api/ai/generate-growth-narrative", async (req, res) => {
  try {
    const { studentId, formResponses } = req.body;

    if (!formResponses || formResponses.length < 2) {
      return res.status(400).json({
        error: "At least 2 form responses are required to generate a narrative",
        status: "validation_failed",
      });
    }

    // Get student name
    let studentName = "el estudiante";
    try {
      const studentDoc = await db.collection("students").doc(studentId).get();
      if (studentDoc.exists) {
        studentName = studentDoc.data()?.name || "el estudiante";
      }
    } catch (e) {
      console.warn("Could not fetch student name:", e);
    }

    // Generate prompt
    const { generateGrowthNarrative } = await import("./src/lib/growthNarrative");
    const prompt = await generateGrowthNarrative(formResponses, studentName);

    // Call DeepSeek
    const result = await ai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      max_tokens: 1000,
    });

    const narrative = result.choices[0].message.content || "";

    res.json({ narrative });
  } catch (error: any) {
    console.error("Error generating narrative:", error);
    res.status(500).json({
      error: "Failed to generate narrative",
      details: error.message,
      status: "error",
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/growthNarrative.ts server.ts
git commit -m "feat: add growth narrative generation via DeepSeek API"
```

---

### Task 8: Add Crecimiento Tab to Student Profile

**Files:**
- Modify: `src/pages/Students.tsx`

- [ ] **Step 1: Import StudentGrowthTimeline and add tab**

Find the section where the student detail modal is rendered (around line 380-500) and add:

```typescript
// Add import at top
import StudentGrowthTimeline from '../components/StudentGrowthTimeline';

// In the modal tabs section (where Personal, Académico, etc. are shown),
// add this new tab option. Find the activeTab useState and add 'crecimiento' to the type:

const [activeTab, setActiveTab] = useState<'personal' | 'academico' | 'familia' | 'salud' | 'crecimiento'>('personal');

// In the tab buttons (around line 420), add:
<button
  onClick={() => setActiveTab('crecimiento')}
  className={`px-4 py-2 rounded-lg font-mono text-xs transition-all ${
    activeTab === 'crecimiento'
      ? 'bg-blue-500 text-white'
      : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
  }`}
>
  📊 Crecimiento
</button>

// In the tab content section (around line 500), add:
{activeTab === 'crecimiento' && selectedStudent && (
  <div className="space-y-4">
    <StudentGrowthTimeline studentId={selectedStudent.id} />
  </div>
)}
```

- [ ] **Step 2: Test the integration**

Run: `npm run dev`

Navigate to a student profile and verify:
1. New "Crecimiento" tab appears
2. Timeline loads without errors
3. Cards are collapsible
4. Narrative button is present

- [ ] **Step 3: Commit**

```bash
git add src/pages/Students.tsx
git commit -m "feat: add Crecimiento tab to student profile with growth timeline"
```

---

### Task 9: Create Import Interface in Dashboard

**Files:**
- Create: `src/pages/ImportForms.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create import forms page**

```typescript
// src/pages/ImportForms.tsx
import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { Page } from '../App';

interface ImportProps {
  onNavigate?: (page: Page) => void;
}

export const ImportForms: React.FC<ImportProps> = ({ onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formType, setFormType] = useState<'inicio_III_medio' | 'fin_I_semestre' | 'inicio_IV_medio'>('inicio_III_medio');
  const [courseId, setCourseId] = useState('course-1');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Solo se permiten archivos CSV');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo CSV');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('formType', formType);
      formData.append('courseId', courseId);

      const response = await fetch('/api/import/form-responses', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setSelectedFile(null);
      } else {
        setError(data.error || 'Error en la importación');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">Importar Formularios</h2>

        <div className="space-y-6 bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">1. Selecciona archivo CSV</label>
            <div
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <Upload className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
              {selectedFile ? (
                <div>
                  <p className="text-white font-bold">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-white">Arrastra un archivo CSV o haz clic para seleccionar</p>
                  <p className="text-xs text-neutral-400 mt-1">Exportado desde Google Forms</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Type Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">2. Tipo de formulario</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="inicio_III_medio">Inicio III Medio</option>
              <option value="fin_I_semestre">Fin I Semestre</option>
              <option value="inicio_IV_medio">Inicio IV Medio</option>
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">3. Curso</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="course-1"
              className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-neutral-400 mt-2">Debe coincidir con courseId en Students</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-300">Importación completada</p>
                  <p className="text-sm text-neutral-200 mt-1">
                    {result.imported} de {result.totalRows} estudiantes importados
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-black/30 rounded p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-yellow-300 mb-2">{result.errors.length} errores:</p>
                  <ul className="text-xs text-neutral-300 space-y-1">
                    {result.errors.slice(0, 5).map((err: any, i: number) => (
                      <li key={i}>
                        Fila {err.row}: {err.email} - {err.reason}
                      </li>
                    ))}
                    {result.errors.length > 5 && <li>... y {result.errors.length - 5} más</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar Formularios'
            )}
          </button>
        </div>

        {/* Back Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('students' as Page)}
            className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-mono"
          >
            ← Volver a Estudiantes
          </button>
        )}
      </div>
    </div>
  );
};

export default ImportForms;
```

- [ ] **Step 2: Add route to App.tsx**

```typescript
// In src/App.tsx, add the route:
import ImportForms from './pages/ImportForms';

// In the switch/case for page routing, add:
case 'import-forms':
  return <ImportForms onNavigate={setCurrentPage} />;
```

- [ ] **Step 3: Add button to Students page**

```typescript
// In Students.tsx, in the header section, add a button:
<button
  onClick={() => onNavigate?.('import-forms' as Page)}
  className="p-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all border border-green-500/30 shadow-sm"
  title="Importar Formularios"
>
  <Upload className="w-5 h-5" />
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/ImportForms.tsx src/App.tsx src/pages/Students.tsx
git commit -m "feat: add ImportForms page and integrate with Students dashboard"
```

---

### Task 10: Testing and Polish

**Files:**
- Modify: Various as needed

- [ ] **Step 1: Test CSV import flow**

1. Run `npm run dev`
2. Export a sample CSV from one of your Google Forms
3. Navigate to "Importar Formularios"
4. Upload CSV, select form type, verify import result
5. Check Firestore to confirm sub-collection created
6. Verify success message shows correct counts

- [ ] **Step 2: Test Student Growth Tab**

1. Open a student profile
2. Click "Crecimiento" tab
3. Verify timeline shows imported form data
4. Test expanding/collapsing cards
5. Test "Comparativas" toggle
6. Test "Relato de IA" button (should generate narrative)

- [ ] **Step 3: Fix any UI/UX issues**

- Handle edge cases (no data, malformed CSV, etc.)
- Ensure error messages are clear
- Test on mobile viewport if needed

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify import flow, timeline display, and narrative generation"
```

---

## Summary

**Total Tasks:** 10

**Key Deliverables:**
- ✅ Phase 1 CSV import with validation
- ✅ Firestore sub-collection storage (`students/{id}/formResponses/`)
- ✅ Student Growth Timeline visualization
- ✅ Expandable category cards with change indicators
- ✅ Side-by-side comparative view
- ✅ DeepSeek integration for on-demand narrative generation
- ✅ Import interface with error reporting
- ✅ Full integration into Students module

**Architecture prepared for Phase 2:**
- Google Forms API integration can be added without schema changes
- Webhook endpoint ready for automatic sync
- CSV import and API can coexist

