# DeepSeek Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Google Gemini 1.5 Flash with DeepSeek API to reduce AI token costs while maintaining identical functionality across all three AI-powered endpoints.

**Architecture:** Swap the Google Gemini client for an OpenAI-compatible DeepSeek client (using the `openai` npm package). DeepSeek's API matches OpenAI's interface, so we only need to change the client initialization and response parsing in `server.ts`. No frontend changes required.

**Tech Stack:** OpenAI SDK v4.x (DeepSeek-compatible), Express.js backend, environment-based configuration

---

## Task 1: Update package.json Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove @google/genai and add openai**

Open `package.json` and replace the dependencies section. Remove the `@google/genai` line and add `"openai": "^4.52.0"` in its place.

Current state in dependencies:
```json
"@google/genai": "^1.52.0",
```

New state:
```json
"openai": "^4.52.0",
```

The complete updated dependencies block should look like:
```json
"dependencies": {
  "openai": "^4.52.0",
  "@tailwindcss/vite": "^4.1.14",
  "@vitejs/plugin-react": "^5.0.4",
  "clsx": "^2.1.1",
  "cytoscape": "^3.33.3",
  "date-fns": "^4.1.0",
  "dotenv": "^17.2.3",
  "express": "^4.21.2",
  "file-saver": "^2.0.5",
  "firebase": "^12.13.0",
  "lucide-react": "^0.546.0",
  "motion": "^12.38.0",
  "papaparse": "^5.5.3",
  "react": "^19.0.1",
  "react-dom": "^19.0.1",
  "react-markdown": "^10.1.0",
  "recharts": "^3.8.1",
  "tailwind-merge": "^3.6.0",
  "vite": "^6.2.3",
  "xlsx": "^0.18.5"
}
```

- [ ] **Step 2: Commit package.json change**

```bash
git add package.json
git commit -m "deps: replace @google/genai with openai for DeepSeek support"
```

---

## Task 2: Install Updated Dependencies

**Files:**
- No file changes (runtime only)

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

Expected output: Should complete without errors. You'll see the `openai` package installed and `@google/genai` removed.

- [ ] **Step 2: Verify installation**

```bash
npm list openai
```

Expected output: Should show `openai@4.52.0` (or similar 4.x version).

---

## Task 3: Update server.ts - Replace Import Statement

**Files:**
- Modify: `server.ts:1-5`

- [ ] **Step 1: Replace the import statement**

Current lines 1-5:
```typescript
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
```

New lines 1-5:
```typescript
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
```

Only change: Line 4 replaces `import { GoogleGenAI } from "@google/genai"` with `import OpenAI from "openai"`

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "refactor: replace GoogleGenAI import with OpenAI"
```

---

## Task 4: Update server.ts - Replace Client Initialization

**Files:**
- Modify: `server.ts:15-23`

- [ ] **Step 1: Replace Gemini client initialization with DeepSeek client**

Current lines 15-23:
```typescript
  // Gemini API setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
```

New lines 15-18:
```typescript
  // DeepSeek API setup
  const ai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseURL: "https://api.deepseek.com",
  });
```

Delete the old `httpOptions` block completely. The new client is simpler.

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "refactor: initialize OpenAI client for DeepSeek API"
```

---

## Task 5: Update server.ts - Replace /api/ai/analyze-risk Endpoint

**Files:**
- Modify: `server.ts:30-60`

- [ ] **Step 1: Replace the analyze-risk endpoint**

Current lines 30-60 (the entire `app.post("/api/ai/analyze-risk", ...)` block):
```typescript
  app.post("/api/ai/analyze-risk", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      const prompt = `Analiza la siguiente data de estudiantes y entrega una evaluación de riesgo en formato JSON.
      Data: ${JSON.stringify(studentData)}
      Retorna un JSON con: 
      - riskStatus: "Rojo" | "Amarillo" | "Verde"
      - contributingFactors: string (escrito en español)
      - recommendedInterventions: string (escrito en español)
      - reasoning: string (escrito en español)`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = result.text || "";
      
      // Basic JSON extraction from markdown if necessary
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("AI Risk Assessment Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Replace with:
```typescript
  app.post("/api/ai/analyze-risk", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      const prompt = `Analiza la siguiente data de estudiantes y entrega una evaluación de riesgo en formato JSON.
      Data: ${JSON.stringify(studentData)}
      Retorna un JSON con: 
      - riskStatus: "Rojo" | "Amarillo" | "Verde"
      - contributingFactors: string (escrito en español)
      - recommendedInterventions: string (escrito en español)
      - reasoning: string (escrito en español)`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });
      
      const text = result.choices[0].message.content || "";
      
      // Basic JSON extraction from markdown if necessary
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } catch (error: any) {
      console.error("AI Risk Assessment Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Key changes:
- Replace `ai.models.generateContent({...})` with `ai.chat.completions.create({...})`
- Use `model: "deepseek-chat"` instead of `"gemini-3-flash-preview"`
- Change `contents: prompt` to `messages: [{ role: "user", content: prompt }]`
- Add `temperature: 1`
- Extract text from `result.choices[0].message.content` instead of `result.text`

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "refactor: update /api/ai/analyze-risk to use DeepSeek API"
```

---

## Task 6: Update server.ts - Replace /api/ai/summarize-student Endpoint

**Files:**
- Modify: `server.ts:62-89`

- [ ] **Step 1: Replace the summarize-student endpoint**

Current lines 62-89:
```typescript
  app.post("/api/ai/summarize-student", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      const prompt = `Genera un resumen completo y profesional del estudiante para prepararse para una entrevista con los apoderados (padres/tutores).
      
      Datos del Estudiante:
      ${JSON.stringify(studentData)}
      
      El resumen debe estar en español y en formato Markdown. 
      Estructura sugerida:
      - Resumen General y Contexto
      - Fortalezas y Logros
      - Áreas de Preocupación / Desafíos (basado en riesgo, conflictos, apoyo externo)
      - Puntos a conversar recomendados para la reunión
      - Tono sugerido para la entrevista`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      res.json({ summary: result.text });
    } catch (error: any) {
      console.error("AI Summarize Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Replace with:
```typescript
  app.post("/api/ai/summarize-student", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      const prompt = `Genera un resumen completo y profesional del estudiante para prepararse para una entrevista con los apoderados (padres/tutores).
      
      Datos del Estudiante:
      ${JSON.stringify(studentData)}
      
      El resumen debe estar en español y en formato Markdown. 
      Estructura sugerida:
      - Resumen General y Contexto
      - Fortalezas y Logros
      - Áreas de Preocupación / Desafíos (basado en riesgo, conflictos, apoyo externo)
      - Puntos a conversar recomendados para la reunión
      - Tono sugerido para la entrevista`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });
      
      res.json({ summary: result.choices[0].message.content });
    } catch (error: any) {
      console.error("AI Summarize Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Key changes:
- Replace `ai.models.generateContent({...})` with `ai.chat.completions.create({...})`
- Use `model: "deepseek-chat"` and `messages` format
- Add `temperature: 1`
- Extract from `result.choices[0].message.content` instead of `result.text`

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "refactor: update /api/ai/summarize-student to use DeepSeek API"
```

---

## Task 7: Update server.ts - Replace /api/ai/generate-report Endpoint

**Files:**
- Modify: `server.ts:91-115`

- [ ] **Step 1: Replace the generate-report endpoint**

Current lines 91-115:
```typescript
  app.post("/api/ai/generate-report", async (req, res) => {
    try {
      const { courseData, timeframe } = req.body;
      
      const prompt = `Genera un reporte profesional de salud del curso basado en esta data para el periodo: ${timeframe}.
      Data: ${JSON.stringify(courseData)}
      El reporte debe estar en formato Markdown, ser muy profesional, en ESPAÑOL, e incluir las siguientes secciones:
      - Estado General
      - Desempeño Académico
      - Dinámicas Relacionales
      - Tendencias Emocionales
      - Logros Principales
      - Desafíos y Recomendaciones`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      res.json({ report: result.text });
    } catch (error: any) {
      console.error("AI Report Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Replace with:
```typescript
  app.post("/api/ai/generate-report", async (req, res) => {
    try {
      const { courseData, timeframe } = req.body;
      
      const prompt = `Genera un reporte profesional de salud del curso basado en esta data para el periodo: ${timeframe}.
      Data: ${JSON.stringify(courseData)}
      El reporte debe estar en formato Markdown, ser muy profesional, en ESPAÑOL, e incluir las siguientes secciones:
      - Estado General
      - Desempeño Académico
      - Dinámicas Relacionales
      - Tendencias Emocionales
      - Logros Principales
      - Desafíos y Recomendaciones`;

      const result = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
      });
      
      res.json({ report: result.choices[0].message.content });
    } catch (error: any) {
      console.error("AI Report Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
```

Key changes:
- Replace `ai.models.generateContent({...})` with `ai.chat.completions.create({...})`
- Use `model: "deepseek-chat"` and `messages` format
- Add `temperature: 1`
- Extract from `result.choices[0].message.content` instead of `result.text`

- [ ] **Step 2: Commit**

```bash
git add server.ts
git commit -m "refactor: update /api/ai/generate-report to use DeepSeek API"
```

---

## Task 8: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace GEMINI_API_KEY with DEEPSEEK_API_KEY**

Current `.env.example`:
```
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
```

New `.env.example`:
```
# DEEPSEEK_API_KEY: Required for DeepSeek AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
DEEPSEEK_API_KEY="MY_DEEPSEEK_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
```

Changes:
- Line 1: `GEMINI_API_KEY` → `DEEPSEEK_API_KEY`
- Line 2-3: Update comment to reference DeepSeek
- Line 4: `GEMINI_API_KEY="MY_GEMINI_API_KEY"` → `DEEPSEEK_API_KEY="MY_DEEPSEEK_API_KEY"`

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example to use DEEPSEEK_API_KEY"
```

---

## Task 9: Create Local .env.local for Testing

**Files:**
- Create: `.env.local` (not committed)

- [ ] **Step 1: Create .env.local with your DeepSeek API key**

Create a new file `.env.local` in the project root with:
```
DEEPSEEK_API_KEY=<your-actual-deepseek-api-key>
APP_URL=http://localhost:3000
```

Replace `<your-actual-deepseek-api-key>` with your actual DeepSeek API key. Do NOT commit this file (it's in `.gitignore`).

- [ ] **Step 2: Verify .env.local is ignored**

```bash
git status
```

Expected output: `.env.local` should NOT appear in the untracked files list.

---

## Task 10: Start Development Server and Verify

**Files:**
- No file changes (runtime only)

- [ ] **Step 1: Start the development server**

```bash
npm run dev
```

Expected output:
```
Server running on http://0.0.0.0:3000
```

The server should start without errors. If you see errors about missing dependencies or imports, go back to Task 2 and verify `npm install` completed.

- [ ] **Step 2: Keep the server running for the next task**

Leave this terminal open. You'll test the endpoints in Task 11.

---

## Task 11: Test /api/ai/analyze-risk Endpoint

**Files:**
- No file changes (testing only)

- [ ] **Step 1: Open a new terminal and test the analyze-risk endpoint**

In a new terminal (keeping the dev server running):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-risk \
  -H "Content-Type: application/json" \
  -d '{
    "studentData": {
      "name": "Juan Pérez",
      "rut": "12345678-9",
      "academicPerformance": "Bajo",
      "behavior": "Disrupted",
      "familyContext": "Broken home",
      "externalSupport": "None"
    }
  }'
```

Expected output: A JSON response with structure:
```json
{
  "riskStatus": "Rojo",
  "contributingFactors": "...",
  "recommendedInterventions": "...",
  "reasoning": "..."
}
```

If you get an error like `"Failed to parse AI response"`, the API call succeeded but the response wasn't valid JSON. Check:
- Your `DEEPSEEK_API_KEY` is correct
- The prompt structure is correct
- The response from DeepSeek is being extracted properly

If you get a 500 error with `error.message`, the API call itself failed. Check your API key and network.

- [ ] **Step 2: Test passed — note response time**

The response should complete in 5-10 seconds. Note if it's significantly slower or faster than before (with Gemini). This is expected to vary based on DeepSeek load.

---

## Task 12: Test /api/ai/summarize-student Endpoint

**Files:**
- No file changes (testing only)

- [ ] **Step 1: Test the summarize-student endpoint**

In your test terminal:

```bash
curl -X POST http://localhost:3000/api/ai/summarize-student \
  -H "Content-Type: application/json" \
  -d '{
    "studentData": {
      "name": "Maria García",
      "rut": "98765432-1",
      "academicPerformance": "Alto",
      "behavior": "Participative",
      "familyContext": "Supportive",
      "strengths": "Leadership, creativity",
      "challenges": "Perfectionism"
    }
  }'
```

Expected output: JSON with a `summary` key containing Markdown-formatted text:
```json
{
  "summary": "# María García\n\n## Resumen General...\n\n## Fortalezas..."
}
```

The summary should be substantial (multiple paragraphs) and in Spanish.

- [ ] **Step 2: Test passed**

Response should complete in 5-10 seconds and contain professional Markdown content.

---

## Task 13: Test /api/ai/generate-report Endpoint

**Files:**
- No file changes (testing only)

- [ ] **Step 1: Test the generate-report endpoint**

In your test terminal:

```bash
curl -X POST http://localhost:3000/api/ai/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "courseData": {
      "courseName": "Matemática 10A",
      "semester": "Primer Semestre 2026",
      "totalStudents": 35,
      "averageGPA": 6.2,
      "academicTrends": "Improving",
      "relationshipDynamics": "Stable with minor conflicts",
      "emotionalTrends": "Positive overall"
    },
    "timeframe": "Enero - Mayo 2026"
  }'
```

Expected output: JSON with a `report` key containing Markdown-formatted report:
```json
{
  "report": "# Reporte de Salud - Matemática 10A\n\n## Estado General\n..."
}
```

The report should include all required sections (Estado General, Desempeño Académico, Dinámicas Relacionales, etc.) and be in Spanish.

- [ ] **Step 2: Test passed**

Response should complete in 5-10 seconds and contain comprehensive course health analysis.

---

## Task 14: Stop Server and Clean Up

**Files:**
- No file changes

- [ ] **Step 1: Stop the development server**

In the terminal running the dev server, press `Ctrl+C` to stop it.

Expected output:
```
^C
```

The server should shut down cleanly.

- [ ] **Step 2: Verify no leftover processes**

```bash
lsof -i :3000
```

Expected output: No processes listening on port 3000 (empty output is success).

---

## Task 15: Final Verification and Summary

**Files:**
- No file changes (verification only)

- [ ] **Step 1: Verify all changed files**

```bash
git log --oneline -10
```

You should see 5 commits:
1. "deps: replace @google/genai with openai for DeepSeek support"
2. "refactor: replace GoogleGenAI import with OpenAI"
3. "refactor: initialize OpenAI client for DeepSeek API"
4. "refactor: update /api/ai/analyze-risk to use DeepSeek API"
5. "refactor: update /api/ai/summarize-student to use DeepSeek API"
6. "refactor: update /api/ai/generate-report to use DeepSeek API"
7. "docs: update .env.example to use DEEPSEEK_API_KEY"

- [ ] **Step 2: Verify no uncommitted changes**

```bash
git status
```

Expected output:
```
On branch main
nothing to commit, working tree clean
```

(Branch name may differ, but "working tree clean" is required.)

- [ ] **Step 3: Verify frontend still builds**

```bash
npm run lint
```

Expected output: No TypeScript errors. Server code compiles cleanly.

---

## Notes

- All three AI endpoints now use DeepSeek with identical business logic
- No frontend changes required (frontend never called Gemini directly)
- Environment variable renamed from `GEMINI_API_KEY` to `DEEPSEEK_API_KEY`
- Response parsing remains identical (JSON and Markdown extraction unchanged)
- Temperature set to 1 (DeepSeek's recommended default for consistency)
