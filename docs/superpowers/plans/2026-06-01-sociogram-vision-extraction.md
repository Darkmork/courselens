# Sociogram Vision-Based Relation Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable sociogram group PDF processing with deepseek-vl2 to extract visual relationship data (arrows, colors, line types) so cohesion and fragmentation metrics are calculated correctly.

**Architecture:** The group report is uploaded as PDF (not markdown) to capture visual sociogram pages. Pages 2-3 are extracted as images, sent to deepseek-vl2 for relation extraction. Individual report remains as markdown for text extraction. Relations are combined with student data and saved to Firestore with correct metrics.

**Tech Stack:** React, Express.js, pdfjs-dist, DeepSeek API (deepseek-chat with vision)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/pages/ImportSociogram.tsx` | Accept `.pdf` for group report upload |
| `server.ts:222-358` | Accept `groupPdf`, orchestrate parsing |
| `src/lib/pulsoParser.ts` | PDF image extraction + VL2 relation extraction |
| `src/types/index.ts` | Already has `SociogramRelation` type |

---

## Task 1: Modify ImportSociogram.tsx to Accept PDF

**Files:**
- Modify: `src/pages/ImportSociogram.tsx:32-62` (group file state and handler)
- Modify: `src/pages/ImportSociogram.tsx:99-108` (FormData key change)

- [ ] **Step 1: Add PDF file state for group**

In `ImportSociogram.tsx` around line 32, change:
```typescript
const [groupMarkdown, setGroupMarkdown] = useState<File | null>(null);
```
to:
```typescript
const [groupPdf, setGroupPdf] = useState<File | null>(null);
```

- [ ] **Step 2: Update handler to accept PDF files**

Around line 44, rename `handleGroupMarkdownChange` to `handleGroupPdfChange` and update validation:
```typescript
const handleGroupPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Accept PDF files only
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    setImportStatus('error');
    setImportMessage('El reporte grupal debe ser un archivo PDF de PULSO.cl');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setImportStatus('error');
    setImportMessage('El archivo es demasiado grande (máximo 10MB)');
    return;
  }

  setGroupPdf(file);
  setImportStatus('idle');
  setImportMessage('✓ Reporte grupal (PDF) cargado');
};
```

- [ ] **Step 3: Update input element for PDF**

Around line 200, change:
```typescript
<input ref={groupInputRef} type="file" accept=".md,text/markdown,text/plain" ...
```
to:
```typescript
<input ref={groupInputRef} type="file" accept=".pdf,application/pdf" ...
```

And update label text:
```typescript
<p>Haz clic para seleccionar el reporte grupal (PDF de PULSO.cl)</p>
```

- [ ] **Step 4: Update FormData to use groupPdf key**

Around line 101, change:
```typescript
formData.append('groupMarkdown', groupMarkdown);
```
to:
```typescript
formData.append('groupPdf', groupPdf);
```

- [ ] **Step 5: Update validation check**

Around line 90, change:
```typescript
if (!groupMarkdown || !individualMarkdown || !year || !courseId) {
```
to:
```typescript
if (!groupPdf || !individualMarkdown || !year || !courseId) {
```

- [ ] **Step 6: Update submit button disabled condition**

Around line 340, change:
```typescript
disabled={importStatus === 'loading' || !groupMarkdown || !individualMarkdown}
```
to:
```typescript
disabled={importStatus === 'loading' || !groupPdf || !individualMarkdown}
```

- [ ] **Step 7: Update help text**

Around line 368, change help text to explain PDF is now required:
```typescript
<li><strong>Reporte Grupal (PDF):</strong> Archivo .pdf del reporte grupal de PULSO.cl (requerido para extraer relaciones visuales)</li>
<li><strong>Reporte Individual (Markdown):</strong> Archivo .md del reporte individual de PULSO.cl</li>
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/ImportSociogram.tsx
git commit -m "feat(ImportSociogram): Accept PDF for group report to enable vision-based relation extraction"
```

---

## Task 2: Update server.ts Endpoint to Accept groupPdf

**Files:**
- Modify: `server.ts:233-260` (file validation and reading)
- Modify: `server.ts:284-291` (call new relation extraction)

- [ ] **Step 1: Update file validation to accept groupPdf**

Around line 234, change:
```typescript
if (!req.files || !req.files.groupMarkdown || !req.files.individualMarkdown) {
  return res.status(400).json({
    error: "Both group and individual markdown files are required for course analysis",
    status: "validation_failed",
  });
}
```
to:
```typescript
if (!req.files || !req.files.groupPdf || !req.files.individualMarkdown) {
  return res.status(400).json({
    error: "Group PDF and individual markdown files are required for course analysis",
    status: "validation_failed",
  });
}
```

- [ ] **Step 2: Update file variable names**

Around line 249, change:
```typescript
const groupMarkdownFile = req.files.groupMarkdown as fileUpload.UploadedFile;
```
to:
```typescript
const groupPdfFile = req.files.groupPdf as fileUpload.UploadedFile;
```

- [ ] **Step 3: Update log message**

Around line 253, change:
```typescript
console.log(`Group markdown file: ${groupMarkdownFile.name}`);
```
to:
```typescript
console.log(`Group PDF file: ${groupPdfFile.name}`);
```

- [ ] **Step 4: Remove markdown buffer conversion**

Around line 257, REMOVE the line:
```typescript
const groupContent = groupMarkdownFile.data.toString('utf-8');
```
(We no longer read group as text - it's a PDF)

- [ ] **Step 5: Call extractRelationsFromPDF after studentData is ready**

After line 282 (where estudiantes array is built), ADD:
```typescript
// Extract visual relationships from group PDF
console.log('Extracting visual relationships from group PDF with deepseek-vl2...');
const studentNames = estudiantes.map((e: any) => e.nombre);
const relaciones = await extractRelationsFromPDF(
  groupPdfFile.data,
  studentNames,
  process.env.DEEPSEEK_API_KEY || ''
);
console.log(`Extracted ${relaciones.length} relations from PDF visual graphs`);
```

- [ ] **Step 6: Commit**

```bash
git add server.ts
git commit -m "feat(server): Accept groupPdf and extract relations via VL2 vision AI"
```

---

## Task 3: Add PDF Image Extraction to pulsoParser.ts

**Files:**
- Create: `src/lib/pulsoParser.ts` - add `extractRelationsFromPDF` function
- Modify: `src/lib/pulsoParser.ts` - no changes to existing functions

- [ ] **Step 1: Add helper function to render PDF page to image**

At the end of `pulsoParser.ts` (before last export), add:

```typescript
/**
 * Render a PDF page to a base64-encoded JPEG image
 */
async function renderPdfPageToBase64(
  pdf: any,
  pageNum: number,
  scale: number = 2.0
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = Buffer.alloc(1); // Will be replaced
  // Use a proper canvas implementation for Node.js
  // This is a placeholder - actual implementation uses canvas or sharp

  // For now, return empty string - actual implementation will render properly
  return '';
}

/**
 * Extract relationships from group PDF using vision AI
 * Processes pages 2-3 (visual sociogram graphs) with deepseek-vl2
 */
export async function extractRelationsFromPDF(
  pdfBuffer: Buffer,
  studentNames: string[],
  apiKey: string
): Promise<SociogramRelation[]> {
  if (!apiKey) {
    console.warn('DEEPSEEK_API_KEY not set, skipping relation extraction');
    return [];
  }

  const pdfjs = await getPdfjs();
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;

  console.log(`PDF has ${pdf.numPages} pages`);

  const relations: SociogramRelation[] = [];

  // Process pages 2-3 (sociogram visual graphs)
  for (const pageNum of [2, 3]) {
    if (pageNum > pdf.numPages) {
      console.log(`Skipping page ${pageNum} - PDF only has ${pdf.numPages} pages`);
      continue;
    }

    try {
      console.log(`Processing page ${pageNum} for visual graph...`);

      // Render page to image (base64)
      const imageBase64 = await renderPdfPageToImage(pdf, pageNum, 2.0);

      if (!imageBase64) {
        console.warn(`Could not render page ${pageNum} to image`);
        continue;
      }

      // Extract relations using vision AI
      const pageRelations = await extractRelationsWithVL2(
        imageBase64,
        studentNames,
        apiKey
      );

      relations.push(...pageRelations);
      console.log(`Page ${pageNum}: extracted ${pageRelations.length} relations`);
    } catch (error) {
      console.error(`Error processing page ${pageNum}:`, error);
      // Continue with other pages - don't fail entire import
    }
  }

  return relations;
}
```

- [ ] **Step 2: Add actual canvas-based image rendering**

Implement `renderPdfPageToImage` using Node.js canvas:

```typescript
async function renderPdfPageToImage(
  pdf: any,
  pageNum: number,
  scale: number = 2.0
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // Dynamic import for canvas (Node.js specific)
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render PDF page to canvas
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  // Convert to base64 JPEG
  return canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '');
}
```

Note: If `canvas` package is not installed, use pdfjs-dist's built-in rendering or skip with warning.

- [ ] **Step 3: Add extractRelationsWithVL2 function**

```typescript
/**
 * Extract relationship edges from a sociogram visual graph using deepseek-vl2
 */
async function extractRelationsWithVL2(
  imageBase64: string,
  studentNames: string[],
  apiKey: string
): Promise<SociogramRelation[]> {
  const deepseek = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' });

  const studentNamesList = studentNames.join(', ');

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
          {
            type: 'text',
            text: `Analyze this sociogram visual graph from PULSO.cl education platform.

STUDENTS in this course: ${studentNamesList}

Extract ALL directed relationship edges shown in the graph. For each edge:
1. Identify the SOURCE student (who made the choice) - the arrow origin
2. Identify the TARGET student (who was chosen) - the arrow destination
3. Determine the RELATIONSHIP TYPE based on line style/color:
   - SOLID GREEN lines = trabajo_positivo (positive work relationships)
   - DASHED GREEN lines = convivencia_positiva (positive coexistence relationships)
   - SOLID RED lines = trabajo_negativo (negative work relationships)
   - DASHED RED lines = convivencia_negativa (negative coexistence relationships)
4. Estimate STRENGTH (1-3) based on line thickness: 1=thin, 2=medium, 3=thick

Return ONLY a JSON array with this exact structure (no other text):
[
  {"from_id": "student-name-1", "to_id": "student-name-2", "tipo": "trabajo_positivo", "fuerza": 2},
  ...
]

Rules:
- Use EXACT student names as provided (case-sensitive match)
- If you cannot identify the exact student, use the closest name match
- Extract ALL visible edges - do not skip any
- Arrow direction indicates: from = nominator, to = nominated`
          },
        ],
      },
    ],
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || '';
  console.log('VL2 response:', content.substring(0, 200));

  // Parse JSON response
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (match) jsonStr = match[1];
    }

    const relations = JSON.parse(jsonStr) as SociogramRelation[];

    // Validate and normalize
    return relations
      .filter((r) => r.from_id && r.to_id && r.tipo)
      .map((r) => ({
        ...r,
        fuerza: Math.min(3, Math.max(1, r.fuerza || 1)),
      }));
  } catch (error) {
    console.error('Failed to parse VL2 relations response:', error);
    console.log('Raw content:', content.substring(0, 500));
    return [];
  }
}
```

- [ ] **Step 4: Add OpenAI import at top of pulsoParser.ts**

At the top of `pulsoParser.ts`, add:
```typescript
import OpenAI from 'openai';
```

- [ ] **Step 5: Install canvas package if needed**

Run: `npm install canvas` (if not already installed, may require libcairo-dev)

- [ ] **Step 6: Test TypeScript compilation**

Run: `npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/lib/pulsoParser.ts
git commit -m "feat(pulsoParser): Add vision-based relation extraction with deepseek-vl2"
```

---

## Task 4: Verify End-to-End Flow and Metrics

**Files:**
- No file changes - verification only

- [ ] **Step 1: Verify metrics calculation works with relations**

Check `src/lib/sociogramMetrics.ts`:

```typescript
// Line 14-18 - cohesion should now calculate correctly
const conexionesReales = relaciones.length;
const conexionesPosibles = estudiantes.length * (estudiantes.length - 1);
const cohesion = conexionesPosibles > 0
  ? (conexionesReales / conexionesPosibles) * 10
  : 0;
```

With actual relations, `conexionesReales > 0` so cohesion will be non-zero.

```typescript
// Line 21-25 - fragmentation should now calculate correctly
const conectados = new Set(relaciones.flatMap(r => [r.from_id, r.to_id]));
const aislados = estudiantes.length - conectados.size;
const fragmentacion = estudiantes.length > 0
  ? (aislados / estudiantes.length) * 100
  : 0;
```

Students with actual connections will not be counted as isolated.

- [ ] **Step 2: Verify no type errors**

Run: `npm run lint`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: Verify metrics calculation works with extracted relations"
```

---

## Execution Order

1. **Task 1** (ImportSociogram.tsx changes) - Start here, frontend
2. **Task 2** (server.ts endpoint changes) - After Task 1
3. **Task 3** (pulsoParser.ts VL2 functions) - Core implementation
4. **Task 4** (Verification) - End to end check

---

## Verification Checklist

After all tasks:
- [ ] ImportSociogram accepts `.pdf` for group, `.md` for individual
- [ ] server.ts passes PDF buffer to `extractRelationsFromPDF`
- [ ] Pages 2-3 rendered to images
- [ ] deepseek-vl2 extracts relationship edges
- [ ] Relations stored in Firestore with student data
- [ ] Cohesion score is realistic (not 0/10)
- [ ] Fragmentation score is realistic (not 100%)
- [ ] `liderazgo_promedio` and `aislamiento_promedio` also work (from menciones)
- [ ] Import summary shows correct relationCount

---

## Error Handling Notes

If `canvas` package fails to install on deployment:
1. Log warning: "Canvas rendering unavailable, skipping visual relation extraction"
2. Return empty relations array
3. Import still succeeds with student data only

If deepseek-vl2 call fails:
1. Catch error, log warning
2. Continue with empty relations
3. Don't fail entire import

If PDF page extraction fails:
1. Log error for specific page
2. Continue with remaining pages
3. Partial relation data is better than none