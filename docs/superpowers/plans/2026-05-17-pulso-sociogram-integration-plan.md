# PULSO.cl Sociogram Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement PULSO.cl PDF import system and replace hardcoded sociogram with real multi-year relational data.

**Architecture:** Two parallel projects with minimal dependencies: (1) PDF parser backend + import UI saves to Firestore `sociogram_[YEAR]/` collections, (2) Sociogram visualization loads real data with year selector and dynamic metrics.

**Tech Stack:** 
- PDF parsing: `pdfjs-dist` (already available in browsers, we'll use `pdf-parse` for Node backend)
- Firestore: real-time listeners with `onSnapshot`
- Cytoscape.js: graph visualization
- React: form handling, state management

---

## File Structure

### Project 1: PDF Import System
- `src/lib/pulsoParser.ts` — PDF text extraction + parsing logic (group + individual)
- `src/pages/ImportSociogram.tsx` — Import form UI + progress feedback
- `server.ts` — `/api/import/sociogram` endpoint handling

### Project 2: Sociogram Visualization
- `src/lib/sociogramMetrics.ts` — Metric calculation functions
- `src/components/YearSelector.tsx` — Year tabs (2025, 2026)
- `src/pages/Sociogram.tsx` — Graph render + real data loading

---

## PROJECT 1: PDF Import System

### Task 1: Install PDF parsing dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add pdf-parse dependency**

Run:
```bash
npm install pdf-parse pdfjs-dist
```

After install, verify in `package.json`:
```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "pdfjs-dist": "^4.0.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add pdf-parse and pdfjs-dist for PULSO.cl import"
```

---

### Task 2: Create Firestore schema types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Sociogram-related types**

Add after the existing `Observation` interface:

```typescript
export interface StudentSociogramData {
  id: string;
  nombre: string;
  rol: 'Líder Positivo' | 'Saludable' | 'Desafío' | 'No responde';
  autoreporte: {
    bienestar_general: number;
    aprendizaje: number;
    relaciones_interpersonales: number;
    autogestion_academica: number;
    inclusion: number;
  };
  menciones_positivas: {
    relaciones_compartir: number;
    relaciones_trabajar: number;
    ayuda_demas: number;
    valor_respeto: number;
    valor_vocacion: number;
    valor_sencillez: number;
    valor_espiritu_comunitario: number;
    valor_responsabilidad: number;
    valor_verdad: number;
    liderazgo: number;
    trata_bien_incluye: number;
    resuelve_conflictos: number;
    total: number;
  };
  menciones_negativas: {
    relaciones_negativas_compartir: number;
    siente_solo: number;
    pasandolo_mal: number;
    relaciones_negativas_trabajar: number;
    molesta_otros: number;
    total: number;
  };
  comentarios: {
    positivos: string | null;
    negativos: string | null;
  };
}

export interface SociogramRelation {
  id?: string;
  from_id: string;
  to_id: string;
  tipo: 'trabajo_positivo' | 'convivencia_positiva' | 'trabajo_negativo' | 'convivencia_negativa';
  fuerza: number; // 1-3
}

export interface SociogramMetrics {
  cohesion: number;
  fragmentacion: number;
  liderazgo_promedio: number;
  aislamiento_promedio: number;
}

export interface SociogramData {
  year: number;
  courseId: string;
  estudiantes: StudentSociogramData[];
  relaciones: SociogramRelation[];
  metricas: SociogramMetrics;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run:
```bash
npm run lint
```

Expected: No errors related to new types.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types: add SociogramData and related interfaces for PULSO.cl import"
```

---

### Task 3: Create PDF parser utility

**Files:**
- Create: `src/lib/pulsoParser.ts`

- [ ] **Step 1: Write parser for group PDF**

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDFJS
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedGroupPDF {
  estudiantes: string[]; // List of student names
  relacionesPorEstudiante: Record<string, Record<string, number>>; // estudiante -> { relation_type: count }
}

export async function parseGroupPDF(file: File): Promise<ParsedGroupPDF> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // Extract text from first page (contains the summary table)
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const text = textContent.items.map((item: any) => item.str).join(' ');
  
  // Simple extraction: look for student names and their relation counts
  // This is approximate - real implementation may need more sophisticated table parsing
  const estudiantes: string[] = [];
  const relacionesPorEstudiante: Record<string, Record<string, number>> = {};
  
  // TODO: Implement actual table parsing logic
  // For now, return placeholder structure
  return { estudiantes, relacionesPorEstudiante };
}
```

- [ ] **Step 2: Write parser for individual PDF**

```typescript
export interface ParsedIndividualPDF {
  estudiantes: Record<string, StudentSociogramData>;
}

export async function parseIndividualPDF(file: File): Promise<ParsedIndividualPDF> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const estudiantes: Record<string, StudentSociogramData> = {};
  
  // Extract text from all pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    
    // Detect student name and parse their section
    const studentSection = extractStudentSection(text);
    if (studentSection) {
      estudiantes[studentSection.nombre] = studentSection.data;
    }
  }
  
  return { estudiantes };
}

function extractStudentSection(text: string): { nombre: string; data: StudentSociogramData } | null {
  // TODO: Implement extraction logic
  // Look for patterns like "Reporte sociograma 2025 - III° C TABOR\n[StudentName]"
  // Then parse autoreporte numbers, menciones, rol, etc.
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/pulsoParser.ts
git commit -m "feat: add PULSO.cl PDF parser utilities (group + individual)"
```

---

### Task 4: Create import API endpoint

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add import endpoint to server**

Add after the `/api/ai/generate-report` endpoint (before Vite middleware):

```typescript
import { parseGroupPDF, parseIndividualPDF } from './src/lib/pulsoParser';
import { doc, setDoc } from 'firebase/firestore';

app.post('/api/import/sociogram', async (req, res) => {
  try {
    const { groupPdfBase64, individualPdfBase64, year, courseId } = req.body;

    if (!groupPdfBase64 || !individualPdfBase64 || !year || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to File-like objects
    const groupBuffer = Buffer.from(groupPdfBase64, 'base64');
    const individualBuffer = Buffer.from(individualPdfBase64, 'base64');

    const groupFile = new File([groupBuffer], 'group.pdf', { type: 'application/pdf' });
    const individualFile = new File([individualBuffer], 'individual.pdf', { type: 'application/pdf' });

    // Parse PDFs
    const groupData = await parseGroupPDF(groupFile);
    const individualData = await parseIndividualPDF(individualFile);

    // Merge and validate
    const estudiantes = mergeStudentData(groupData, individualData);
    const relaciones = buildRelations(groupData, estudiantes);
    const metricas = calculateMetrics(estudiantes, relaciones);

    // Save to Firestore
    const sociogramRef = doc(db, `sociogram_${year}`, courseId);
    await setDoc(sociogramRef, {
      year,
      courseId,
      estudiantes,
      relaciones,
      metricas,
      importedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Sociograma ${year} importado: ${estudiantes.length} estudiantes, ${relaciones.length} relaciones`,
      estudiantes: estudiantes.length,
      relaciones: relaciones.length
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

function mergeStudentData(groupData: any, individualData: any): any[] {
  // TODO: Implement merge logic
  return [];
}

function buildRelations(groupData: any, estudiantes: any[]): any[] {
  // TODO: Implement relation extraction from groupData and individual mentions
  return [];
}

function calculateMetrics(estudiantes: any[], relaciones: any[]): any {
  // TODO: Implement metric calculation
  return {};
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run lint
```

Expected: No TypeScript errors in server.ts additions.

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: add POST /api/import/sociogram endpoint"
```

---

### Task 5: Create ImportSociogram page

**Files:**
- Create: `src/pages/ImportSociogram.tsx`

- [ ] **Step 1: Create basic form component**

```typescript
import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ImportSociogram: React.FC = () => {
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [individualFile, setIndividualFile] = useState<File | null>(null);
  const [year, setYear] = useState<2025 | 2026>(2025);
  const [courseId, setCourseId] = useState('default-course');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const groupInputRef = useRef<HTMLInputElement>(null);
  const individualInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFile || !individualFile) {
      setStatus({ type: 'error', message: 'Ambos archivos son requeridos' });
      return;
    }

    setIsLoading(true);
    try {
      const groupBase64 = await fileToBase64(groupFile);
      const individualBase64 = await fileToBase64(individualFile);

      const response = await fetch('/api/import/sociogram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupPdfBase64: groupBase64,
          individualPdfBase64: individualBase64,
          year,
          courseId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error en la importación');
      }

      setStatus({
        type: 'success',
        message: data.message
      });
      setGroupFile(null);
      setIndividualFile(null);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Importar Sociograma</h2>
        <p className="text-neutral-400">Carga los reportes de PULSO.cl para actualizar dinámicas relacionales</p>
      </header>

      <form onSubmit={handleImport} className="bg-[#111111] border border-white/10 rounded-3xl p-8 space-y-6">
        {/* Group PDF Upload */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 mb-3 font-mono uppercase tracking-wider">
            Reporte Grupal (PDF)
          </label>
          <div className="relative">
            <input
              ref={groupInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setGroupFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => groupInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-white/20 rounded-2xl hover:border-blue-500 transition-colors text-center"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
              <p className="text-white font-bold">{groupFile?.name || 'Selecciona reporte grupal'}</p>
              <p className="text-xs text-neutral-500 mt-1">ej: Reporte Sociograma 2025 - Curso - III° C TABOR.pdf</p>
            </button>
          </div>
        </div>

        {/* Individual PDF Upload */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 mb-3 font-mono uppercase tracking-wider">
            Reporte Individual (PDF)
          </label>
          <div className="relative">
            <input
              ref={individualInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setIndividualFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => individualInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-white/20 rounded-2xl hover:border-blue-500 transition-colors text-center"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
              <p className="text-white font-bold">{individualFile?.name || 'Selecciona reporte individual'}</p>
              <p className="text-xs text-neutral-500 mt-1">ej: Reporte Sociograma 2025 - Individual - III° C TABOR.pdf</p>
            </button>
          </div>
        </div>

        {/* Year & Course */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Año</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) as 2025 | 2026)}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-2xl text-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 font-mono uppercase tracking-wider">Curso</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="default-course"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-2xl text-white"
            />
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${
            status.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-2xl font-bold transition-all ${
            isLoading
              ? 'bg-neutral-800 text-neutral-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
          }`}
        >
          {isLoading ? 'Importando...' : 'Importar Sociograma'}
        </button>
      </form>
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default ImportSociogram;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ImportSociogram.tsx
git commit -m "feat: create ImportSociogram page with PDF upload form"
```

---

## PROJECT 2: Sociogram Visualization Overhaul

### Task 6: Create metrics calculation utility

**Files:**
- Create: `src/lib/sociogramMetrics.ts`

- [ ] **Step 1: Implement metric functions**

```typescript
import { SociogramData, SociogramMetrics } from '../types';

export function calculateMetrics(data: SociogramData): SociogramMetrics {
  const { estudiantes, relaciones } = data;

  // Cohesion: actual connections / possible connections * 10
  const conexionesReales = relaciones.length;
  const conexionesPosibles = estudiantes.length * (estudiantes.length - 1);
  const cohesion = conexionesPosibles > 0 ? (conexionesReales / conexionesPosibles) * 10 : 0;

  // Fragmentation: % of students with 0 connections
  const conectados = new Set(
    relaciones.flatMap(r => [r.from_id, r.to_id])
  );
  const aislados = estudiantes.length - conectados.size;
  const fragmentacion = estudiantes.length > 0 ? (aislados / estudiantes.length) * 100 : 0;

  // Average leadership: avg positive mentions per student
  const liderazgoPromedio = estudiantes.length > 0
    ? estudiantes.reduce((sum, e) => sum + e.menciones_positivas.total, 0) / estudiantes.length
    : 0;

  // Isolation: % of students with 0 positive mentions
  const sinMenciones = estudiantes.filter(e => e.menciones_positivas.total === 0).length;
  const aislamientoPromedio = estudiantes.length > 0 ? (sinMenciones / estudiantes.length) * 100 : 0;

  return {
    cohesion: Math.round(cohesion * 10) / 10,
    fragmentacion: Math.round(fragmentacion),
    liderazgo_promedio: Math.round(liderazgoPromedio * 10) / 10,
    aislamiento_promedio: Math.round(aislamientoPromedio)
  };
}
```

- [ ] **Step 2: Add test file**

Create `src/__tests__/sociogramMetrics.test.ts`:

```typescript
import { calculateMetrics } from '../lib/sociogramMetrics';
import { SociogramData } from '../types';

describe('sociogramMetrics', () => {
  it('calculates cohesion correctly', () => {
    const mockData: SociogramData = {
      year: 2025,
      courseId: 'test-course',
      estudiantes: [
        {
          id: '1',
          nombre: 'Student A',
          rol: 'Saludable',
          autoreporte: { bienestar_general: 5, aprendizaje: 5, relaciones_interpersonales: 5, autogestion_academica: 5, inclusion: 5 },
          menciones_positivas: { relaciones_compartir: 2, relaciones_trabajar: 1, ayuda_demas: 0, valor_respeto: 0, valor_vocacion: 0, valor_sencillez: 0, valor_espiritu_comunitario: 0, valor_responsabilidad: 0, valor_verdad: 0, liderazgo: 0, trata_bien_incluye: 0, resuelve_conflictos: 0, total: 3 },
          menciones_negativas: { relaciones_negativas_compartir: 0, siente_solo: 0, pasandolo_mal: 0, relaciones_negativas_trabajar: 0, molesta_otros: 0, total: 0 },
          comentarios: { positivos: null, negativos: null }
        },
        {
          id: '2',
          nombre: 'Student B',
          rol: 'Saludable',
          autoreporte: { bienestar_general: 4, aprendizaje: 4, relaciones_interpersonales: 4, autogestion_academica: 4, inclusion: 4 },
          menciones_positivas: { relaciones_compartir: 1, relaciones_trabajar: 2, ayuda_demas: 1, valor_respeto: 0, valor_vocacion: 0, valor_sencillez: 0, valor_espiritu_comunitario: 0, valor_responsabilidad: 0, valor_verdad: 0, liderazgo: 0, trata_bien_incluye: 0, resuelve_conflictos: 0, total: 4 },
          menciones_negativas: { relaciones_negativas_compartir: 0, siente_solo: 0, pasandolo_mal: 0, relaciones_negativas_trabajar: 0, molesta_otros: 0, total: 0 },
          comentarios: { positivos: null, negativos: null }
        }
      ],
      relaciones: [
        { from_id: '1', to_id: '2', tipo: 'trabajo_positivo', fuerza: 1 }
      ],
      metricas: { cohesion: 0, fragmentacion: 0, liderazgo_promedio: 0, aislamiento_promedio: 0 }
    };

    const metrics = calculateMetrics(mockData);
    
    // Cohesion: 1 connection / (2 * 1) possible = 0.5 * 10 = 5.0
    expect(metrics.cohesion).toBe(5.0);
    expect(metrics.fragmentacion).toBe(0); // Both students connected
    expect(metrics.liderazgo_promedio).toBe(3.5); // (3 + 4) / 2
  });

  it('handles empty data gracefully', () => {
    const emptyData: SociogramData = {
      year: 2025,
      courseId: 'test',
      estudiantes: [],
      relaciones: [],
      metricas: { cohesion: 0, fragmentacion: 0, liderazgo_promedio: 0, aislamiento_promedio: 0 }
    };

    const metrics = calculateMetrics(emptyData);
    expect(metrics.cohesion).toBe(0);
    expect(metrics.fragmentacion).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- sociogramMetrics
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/sociogramMetrics.ts src/__tests__/sociogramMetrics.test.ts
git commit -m "feat: add sociogram metrics calculation with tests"
```

---

### Task 7: Create YearSelector component

**Files:**
- Create: `src/components/YearSelector.tsx`

- [ ] **Step 1: Implement year selector tabs**

```typescript
import React from 'react';

interface YearSelectorProps {
  selectedYear: 2025 | 2026;
  onYearChange: (year: 2025 | 2026) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ selectedYear, onYearChange }) => {
  return (
    <div className="flex gap-2">
      {[2025, 2026].map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year as 2025 | 2026)}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            selectedYear === year
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10'
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
};

export default YearSelector;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/YearSelector.tsx
git commit -m "feat: create YearSelector component"
```

---

### Task 8: Rewrite Sociogram.tsx with real data loading

**Files:**
- Modify: `src/pages/Sociogram.tsx`

- [ ] **Step 1: Rewrite imports and state**

Replace lines 1-20 with:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, SociogramData, SociogramRelation } from '../types';
import { Share2, Info, Maximize2, RefreshCw, Users } from 'lucide-react';
import { calculateMetrics } from '../lib/sociogramMetrics';
import YearSelector from '../components/YearSelector';

const Sociogram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [selectedYear, setSelectedYear] = useState<2025 | 2026>(2025);
  const [sociogramData, setSociogramData] = useState<SociogramData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseId] = useState('default-course');
  const [isLoading, setIsLoading] = useState(true);
```

- [ ] **Step 2: Add effect to load sociogram data**

Add after state declarations:

```typescript
  useEffect(() => {
    const docRef = doc(db, `sociogram_${selectedYear}`, courseId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSociogramData(snapshot.data() as SociogramData);
          setIsLoading(false);
        } else {
          setSociogramData(null);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error loading sociogram:', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedYear, courseId]);
```

- [ ] **Step 3: Replace Cytoscape initialization logic**

Replace the entire useEffect at line 21 with:

```typescript
  useEffect(() => {
    if (!containerRef.current || !sociogramData || sociogramData.estudiantes.length === 0) return;

    const elementos: cytoscape.ElementDefinition[] = sociogramData.estudiantes.map(e => ({
      data: {
        id: e.id,
        label: e.nombre.split(' ')[0],
        role: e.rol
      }
    }));

    // Add real relations from data
    sociogramData.relaciones.forEach((rel, idx) => {
      elementos.push({
        data: {
          id: `e${idx}`,
          source: rel.from_id,
          target: rel.to_id,
          tipo: rel.tipo,
          fuerza: rel.fuerza
        }
      });
    });

    const cytoscapeInstance = cytoscape({
      container: containerRef.current,
      elements: elementos,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#050505',
            'border-width': 2,
            'border-color': (ele) => {
              const role = ele.data('role');
              if (role === 'Líder Positivo') return '#10b981';
              if (role === 'Desafío') return '#ef4444';
              if (role === 'No responde') return '#f59e0b';
              return '#8b5cf6'; // Saludable (default)
            },
            'width': 60,
            'height': 60,
            'label': 'data(label)',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-color': '#050505',
            'text-outline-width': 2,
            'font-family': 'monospace',
            'text-transform': 'uppercase'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => ele.data('fuerza') * 1.5,
            'line-color': (ele) => {
              const tipo = ele.data('tipo');
              if (tipo === 'trabajo_positivo') return '#10b981';
              if (tipo === 'convivencia_positiva') return '#3b82f6';
              if (tipo === 'trabajo_negativo') return '#ef4444';
              if (tipo === 'convivencia_negativa') return '#dc2626';
              return '#666';
            },
            'line-style': (ele) => {
              const tipo = ele.data('tipo');
              return tipo.includes('convivencia') ? 'dashed' : 'solid';
            },
            'target-arrow-color': (ele) => {
              const tipo = ele.data('tipo');
              if (tipo === 'trabajo_positivo') return '#10b981';
              if (tipo === 'convivencia_positiva') return '#3b82f6';
              if (tipo === 'trabajo_negativo') return '#ef4444';
              if (tipo === 'convivencia_negativa') return '#dc2626';
              return '#666';
            },
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        padding: 50
      }
    });

    setCy(cytoscapeInstance);
    return () => cytoscapeInstance.destroy();
  }, [sociogramData]);
```

- [ ] **Step 4: Update JSX to show real metrics**

Replace the metrics section (around line 150-170) with:

```typescript
        {sociogramData && (
          <div className="absolute top-6 left-6 w-64 space-y-4 pointer-events-none">
            <div className="bg-[#111111]/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl pointer-events-auto">
              <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider font-mono">Salud del Curso</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Cohesión</span>
                    <span className="font-bold text-blue-400 font-mono text-sm">{sociogramData.metricas.cohesion.toFixed(1)}/10</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-blue-500 h-full shadow-[0_0_10px_#3b82f6]"
                      style={{ width: `${(sociogramData.metricas.cohesion / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Fragmentación</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">{sociogramData.metricas.fragmentacion}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] border border-[#050505] h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-amber-500 h-full shadow-[0_0_10px_#f59e0b]"
                      style={{ width: `${sociogramData.metricas.fragmentacion}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Liderazgo Promedio</span>
                    <span className="font-bold text-green-400 font-mono text-sm">{sociogramData.metricas.liderazgo_promedio.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500 font-mono">Aislamiento</span>
                    <span className="font-bold text-red-400 font-mono text-sm">{sociogramData.metricas.aislamiento_promedio}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
```

- [ ] **Step 5: Add year selector to header**

Replace the header section with:

```typescript
      <header className="p-4 md:p-8 bg-[#111111]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Share2 className="w-8 h-8 text-blue-600" />
            Inteligencia Relacional
          </h2>
          <p className="text-sm text-neutral-400">Mapeo visual de dinámicas interpersonales y cohesión grupal.</p>
        </div>
        <div className="flex gap-3 items-center">
          <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
          <button
            onClick={() => cy?.layout({ name: 'cose', animate: true }).run()}
            className="p-3 bg-[#111] text-neutral-400 rounded-xl hover:bg-[#1a1a1a] transition-all border border-white/10 shadow-sm hover:text-white"
            title="Actualizar Diseño"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            className="p-3 bg-[#111] text-neutral-400 rounded-xl hover:bg-[#1a1a1a] transition-all border border-white/10 shadow-sm hover:text-white"
            title="Leyenda"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>
```

- [ ] **Step 6: Add no-data state**

Replace the empty state JSX with:

```typescript
        {!isLoading && !sociogramData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/80 backdrop-blur-md z-10">
            <div className="text-center p-8 border border-white/10 rounded-3xl bg-[#0a0a0a]">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Users className="w-8 h-8 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">Sin datos de sociograma</h3>
              <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                No hay datos de sociograma para {selectedYear}. Importa un reporte de PULSO.cl desde la sección "Importar Sociograma".
              </p>
            </div>
          </div>
        )}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run:
```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Sociogram.tsx
git commit -m "feat: replace hardcoded sociogram with real PULSO.cl data and year selector"
```

---

### Task 9: Update routing to include ImportSociogram page

**Files:**
- Modify: `src/App.tsx` or routing config

- [ ] **Step 1: Check current routing structure**

Look for where pages are routed (likely in App.tsx or a separate routes file).

- [ ] **Step 2: Add ImportSociogram route**

Add route for ImportSociogram page (example if using React Router):

```typescript
import ImportSociogram from './pages/ImportSociogram';

// In route config:
{
  path: '/import-sociogram',
  element: <ImportSociogram />
}
```

Or if using navigation menus, add a link to `/import-sociogram`.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx  # or whatever routing file
git commit -m "feat: add ImportSociogram page route"
```

---

### Task 10: Full integration test

**Files:**
- Test locally

- [ ] **Step 1: Start dev server**

Run:
```bash
npm run dev
```

- [ ] **Step 2: Test ImportSociogram page**

Navigate to `/import-sociogram`:
- Upload sample group PDF
- Upload sample individual PDF
- Select year 2025
- Click "Importar"
- Expected: Success message, data saved to Firestore `sociogram_2025/default-course`

- [ ] **Step 3: Test Sociogram visualization**

Navigate to `/sociogram`:
- Verify graph renders with real data (nodes + edges)
- Verify metrics display (Cohesión, Fragmentación, etc.)
- Click year selector tabs: 2025 ↔ 2026
- Expected: Graph updates in real-time

- [ ] **Step 4: Verify no TypeScript errors**

Run:
```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete PULSO.cl sociogram integration with multi-year visualization"
```

---

## Verification Checklist

- [ ] Sociogram loads real data from `sociogram_[YEAR]` collections
- [ ] Metrics calculate dynamically (cohesión, fragmentación, liderazgo, aislamiento)
- [ ] Year selector switches between 2025/2026 in real-time
- [ ] Import form successfully parses and saves PDFs
- [ ] Node colors reflect roles (Líder=green, Saludable=purple, Desafío=red)
- [ ] Edge styles reflect relation type (trabajo=solid, convivencia=dashed; positivo=green/blue, negativo=red)
- [ ] Edge thickness reflects relation strength (fuerza 1-3)
- [ ] No data state shows appropriate message
- [ ] TypeScript type checking passes
- [ ] No console errors in browser

---
