# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClassSphere** is an AI-powered course management system designed for educators to manage academic, relational, and emotional aspects of their courses. It features intelligent analytics, student risk assessment, relationship mapping (sociogram), conflict tracking, and AI-generated reports using Google Gemini.

## Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4 (with Vite plugin)
- **Backend:** Express.js (Node.js) running via `tsx` in dev, `esbuild` in production
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth (Google Login)
- **AI:** Google Gemini 1.5 Flash (integrated server-side via `@google/genai`), DeepSeek API (growth narratives)
- **Visualization:** Recharts (analytics), Lucide icons; Sociogram uses sortable data table (replaced Cytoscape.js)
- **Data:** PapaParse (CSV), xlsx, FileSaver (exports), CSV file upload via express-fileupload
- **PDF Parsing:** pdfjs-dist (text extraction), pdf-parse (server-side)
- **File Upload:** express-fileupload (multipart form data)

## Commands

```bash
npm run dev          # Start dev server (Vite + Express via tsx)
npm run build        # Build for production: Vite frontend + esbuild server.ts → dist/
npm run start        # Run production build (node dist/server.cjs)
npm run lint         # Type-check with TypeScript (tsc --noEmit)
npm run clean        # Remove dist/ and server.js
```

## Architecture

### Frontend Structure
- `src/pages/` — Main page components (Dashboard, Students, Sociogram, Conflicts, CourseLife, Spiritual, Projects, ImportForms)
  - **Sociogram** — Relational network visualization with real Firestore data, YearSelector for multi-year navigation
  - **ImportSociogram** — PDF upload form for PULSO.cl group + individual reports
  - **ImportForms** — CSV import for Google Forms responses (timeline data: inicio_III_medio, fin_I_semestre, inicio_IV_medio)
  - **Students** — Student list + Crecimiento tab with StudentGrowthTimeline, FormResponseCard, GrowthComparative
  - **CourseLife** — Course-level reportage with AI-generated narratives and collective journey visualization
  - **StudentLife** — Individual student narrative timeline with AI generation
- `src/components/` — Reusable UI components (Login, Layout, Logo)
  - **YearSelector** — Year navigation tabs (2024-2027) with prev/next buttons
  - **StudentGrowthTimeline** — Visual timeline of growth responses over time
  - **FormResponseCard** — Card display for individual form responses
  - **GrowthComparative** — Comparison view across multiple form responses
- `src/lib/firebase.ts` — Firebase client configuration
- `src/lib/pulsoParser.ts` — PDF text extraction for PULSO.cl reports (parseGroupPDF, parseIndividualPDF)
- `src/lib/csvParser.ts` — CSV validation and parsing for Google Forms responses
- `src/lib/growthNarrative.ts` — Prompt building for AI growth narrative generation
- `src/lib/sociogramMetrics.ts` — Metric calculation (cohesion, fragmentation, leadership, isolation)
- `src/types/index.ts` — TypeScript type definitions (StudentSociogramData, SociogramRelation, SociogramMetrics, SociogramData, FormResponse)
- `src/utils/` — Helper functions (CSV parsing, etc.)

### Backend (server.ts)
Express server handling:
- `/api/health` — Health check
- `/api/ai/analyze-risk` — Student risk assessment via Gemini
- `/api/ai/summarize-student` — Parent meeting summary generation
- `/api/ai/generate-report` — Course health report generation
- **`POST /api/import/sociogram`** — PULSO.cl PDF import (multipart file upload)
  - Accepts: groupPdf, individualPdf, year, courseId
  - Returns: studentCount, relationCount, metrics (cohesion, fragmentation, leadership, isolation)
  - Saves to `sociogram_${year}/${courseId}` collection
- **`POST /api/import/form-responses`** — Google Forms response import (CSV file upload)
  - Accepts: csvFile, formType (inicio_III_medio | fin_I_semestre | inicio_IV_medio), courseId
  - Returns: importedCount, validationErrors[], summary of parsed responses
  - Saves to `students/{studentId}/formResponses/{responseId}` as a sub-collection of each student, with timestamp and form type
  - Note: Form responses are stored as a sub-collection under each student document, not at the course level
- **`POST /api/ai/generate-growth-narrative`** — AI-powered growth narrative generation
  - Accepts: formResponses (array), studentName
  - Uses DeepSeek API to generate personalized growth narratives
  - Returns: narrative text describing student evolution, patterns, and future projections
- Vite middleware in dev, static serving in production

### Database (Firestore)
Collections defined in `firebase-blueprint.json`:
- **courses** — Course info and health scores
- **students** — Student profiles (risk level, diagnoses, family context)
- **observations** — Teacher narrative notes
- **conflicts** — Incident tracking and resolution
- **agreements** — Student commitments with deadlines

**Sociogram Collections** (PULSO.cl integration):
- **sociogram_2025, sociogram_2026, ...** — Multi-year relational network data
  - Document key: `courseId`
  - Fields: `year`, `estudiantes[]`, `relaciones[]`, `metricas{cohesion, fragmentacion, liderazgo_promedio, aislamiento_promedio}`
  - Source: Imported from PULSO.cl group + individual reports

Security rules in `firestore.rules` enforce auth and teacher-based access control.

## Environment

Create `.env.local` (or `.env` for production):
```
GEMINI_API_KEY=<your-gemini-api-key>
DEEPSEEK_API_KEY=<your-deepseek-api-key>  # For growth narrative generation
FIREBASE_API_KEY=<firebase-api-key>
FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
FIREBASE_PROJECT_ID=<firebase-project-id>
APP_URL=<deployed-url>  # For production
```

The app runs on `http://0.0.0.0:3000` by default.

## Key Implementation Details

### Frontend-Backend Communication
- **Business data** (students, conflicts, etc.) — Direct Firestore SDK calls for real-time reactivity
- **AI functions** — Proxied through Express server to protect `GEMINI_API_KEY`

### Build Process
- Vite handles React/TypeScript compilation with Tailwind CSS 4
- In production, esbuild bundles `server.ts` as CommonJS (`dist/server.cjs`) with external packages preserved
- Static files served from `dist/` with SPA fallback to `index.html`

### Type Safety
- `tsconfig.json` targets ES2022, uses "bundler" module resolution, enables JSX
- No emit (type-check only), isolated modules for faster builds

## PULSO.cl Sociogram Integration

The Sociogram feature has been enhanced with real data import from PULSO.cl platform:

**User Flow:**
1. Teacher uploads PULSO.cl group + individual PDF reports
2. Backend parses PDFs, extracts student relationships and metrics
3. Data stored in Firestore (sociogram_2025, sociogram_2026, etc.)
4. Sociogram page displays real network visualization with year selector
5. Multi-year comparison shows how course dynamics change over time

**Known Issues & TODOs:**
- PDF text extraction (parseGroupPDF, parseIndividualPDF) needs layout-aware parsing. Current regex-based approach fails with continuous text streams. **TODO:** Implement pdf-parse backend or Y-position-based text reconstruction for accurate student/relation extraction.
- Form response CSV import currently maps to standard PersonalityTrait set; custom form fields may need schema updates in `FormResponse` type.

## Development Notes

- The app is primarily built for AI Studio (a visual IDE) but runs standalone locally
- Some environment behaviors are disabled during agent edits (HMR, file watching) via `DISABLE_HMR` env var
- All CSS is utility-first Tailwind; custom styles in `src/index.css`
- AI responses are parsed as JSON or Markdown depending on the endpoint
- Firestore listeners (onSnapshot) are used for real-time data updates; always clean up subscriptions in useEffect return
- CSV parsing uses PapaParse for validation and type conversion; check `src/lib/csvParser.ts` for form-response schema
- Growth narratives use DeepSeek API with Spanish language prompts; responses are typically 250-400 words
- Form response types (FormResponse) have PersonalityTrait enum mapping to Google Forms question structure
