# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClassSphere** is an AI-powered course management system designed for educators to manage academic, relational, and emotional aspects of their courses. It features intelligent analytics, student risk assessment, relationship mapping (sociogram), conflict tracking, and AI-generated reports using Google Gemini.

## Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4 (with Vite plugin)
- **Backend:** Express.js (Node.js) running via `tsx` in dev, `esbuild` in production
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth (Google Login)
- **AI:** Google Gemini 1.5 Flash (integrated server-side via `@google/genai`)
- **Visualization:** Cytoscape.js (sociogram), Recharts (analytics), Lucide icons
- **Data:** PapaParse (CSV), xlsx, FileSaver (exports)

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
- `src/pages/` — Main page components (Dashboard, Students, Sociogram, Conflicts, CourseLife, Spiritual, Projects)
- `src/components/` — Reusable UI components (Login, Layout, Logo)
- `src/lib/firebase.ts` — Firebase client configuration
- `src/types/index.ts` — TypeScript type definitions
- `src/utils/` — Helper functions (CSV parsing, etc.)

### Backend (server.ts)
Express server handling:
- `/api/health` — Health check
- `/api/ai/analyze-risk` — Student risk assessment via Gemini
- `/api/ai/summarize-student` — Parent meeting summary generation
- `/api/ai/generate-report` — Course health report generation
- Vite middleware in dev, static serving in production

### Database (Firestore)
Collections defined in `firebase-blueprint.json`:
- **courses** — Course info and health scores
- **students** — Student profiles (risk level, diagnoses, family context)
- **observations** — Teacher narrative notes
- **conflicts** — Incident tracking and resolution
- **agreements** — Student commitments with deadlines

Security rules in `firestore.rules` enforce auth and teacher-based access control.

## Environment

Create `.env.local` (or `.env` for production):
```
GEMINI_API_KEY=<your-gemini-api-key>
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

## Development Notes

- The app is primarily built for AI Studio (a visual IDE) but runs standalone locally
- Some environment behaviors are disabled during agent edits (HMR, file watching) via `DISABLE_HMR` env var
- All CSS is utility-first Tailwind; custom styles in `src/index.css`
- AI responses are parsed as JSON or Markdown depending on the endpoint
