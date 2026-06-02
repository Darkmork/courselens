# CourseLenses Complete Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 37 issues found in the comprehensive project audit, covering data consistency, Firebase integration, frontend architecture, AI endpoints, and security.

**Architecture:** The plan is organized in phases by priority (Critical → High → Medium → Minor). Each phase addresses related issues together. The worktree approach allows isolated development without affecting main branch until ready.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Express.js, Firebase Firestore, DeepSeek API

---

## Phase 1: Critical Issues (Data & Firebase)

### Task 1: Fix Dashboard.tsx - Remove Hardcoded Stats

**Files:**
- Modify: `src/pages/Dashboard.tsx:126-129` (calculateGrowthScore)
- Modify: `src/pages/Dashboard.tsx:129-134` (stats object)

**Analysis:** The `calculateGrowthScore` uses `Math.random()` returning fake values. The stats object has hardcoded `formResponsesCount: 50`, `cohesionScore: 8`, `leadershipScore: 7`, `emotionalWellness: 7.5`.

**Fix Approach:**
- `calculateGrowthScore` should compute real growth from actual student form responses
- Stats should be computed from Firestore data:
  - `formResponsesCount`: Count form responses for students in current course
  - `cohesionScore`: From sociogram data if available, else compute from relationships
  - `leadershipScore`: From sociogram metrics
  - `emotionalWellness`: Average from student form responses emotional data

### Task 2: Fix CourseLife.tsx - Remove Hardcoded Stats

**Files:**
- Modify: `src/pages/CourseLife.tsx:127-134` (stats prop)

**Analysis:** Stats object passed to CourseNarrative has 5 hardcoded values: `formResponsesCount: 50`, `momentsCapured`, `cohesionScore: 8`, `leadershipScore: 7`, `emotionalWellness: 7.5`.

**Fix Approach:**
- Compute `formResponsesCount` by querying `students` collection with courseId filter, then counting their formResponses subcollection
- `momentsCapured` should be derived from actual form types present in the data
- `cohesionScore` and `leadershipScore` should come from sociogram data if available
- `emotionalWellness` should be computed from actual student emotional data

### Task 3: Fix Firebase Database Configuration Mismatch

**Files:**
- Modify: `src/lib/firebase.ts:8`
- Modify: `server.ts:74-76` (Admin initialization)

**Analysis:** Client uses `getFirestore(app, firebaseConfig.firestoreDatabaseId)` with custom database ID, while server uses default database. The second argument to `getFirestore()` may not work correctly.

**Fix Approach:**
- Option 1 (Recommended): Remove custom database ID from client config, use default for both
- Option 2: Ensure server also uses the same custom database ID
- Add validation that client and server are pointing to same database

### Task 4: Fix CourseLife.tsx - Listener Cleanup Issue

**Files:**
- Modify: `src/pages/CourseLife.tsx:69-72` (useEffect cleanup)

**Analysis:** Two onSnapshot listeners created (students at line 28, courses at line 43), but cleanup only references `unsubscribe` (the first listener) and `courseUnsubscribe` (the second). However, the naming suggests possible confusion about which listener is which.

**Fix Approach:**
- Rename listeners to `studentsUnsubscribe` and `coursesUnsubscribe` for clarity
- Ensure both are properly cleaned up in the useEffect return function

---

## Phase 2: High Priority (Documentation & Security)

### Task 5: Update CLAUDE.md - AI Provider Documentation

**Files:**
- Modify: `CLAUDE.md:15` (AI stack description)

**Analysis:** CLAUDE.md says "Google Gemini 1.5 Flash" but all AI endpoints use DeepSeek API.

**Fix Approach:**
- Update line 15 to: `- **AI:** Google Gemini 1.5 Flash (for analyze-risk), DeepSeek API (for growth narratives, student/course narratives)`
- Or clarify that most AI functionality uses DeepSeek

### Task 6: Update CLAUDE.md - Add Missing Endpoints

**Files:**
- Modify: `CLAUDE.md` (Backend section)

**Analysis:** Three endpoints exist in server.ts but not documented:
- `POST /api/regenerate-course-vision` (line 361-437)
- `POST /api/import/forms-batch` (line 609-766)
- `POST /api/generate/student-narrative` (line 769-858)

**Fix Approach:**
- Add `POST /api/regenerate-course-vision` to backend endpoints
- Add `POST /api/import/forms-batch` to backend endpoints (batch 3-form import)
- Add `POST /api/generate/student-narrative` to backend endpoints
- Clarify that `POST /api/import/form-responses` is single CSV (not batch)

### Task 7: Update CLAUDE.md - Fix Form Responses Collection Path

**Files:**
- Modify: `CLAUDE.md:62-65` (form-responses description)

**Analysis:** CLAUDE.md says form responses are stored in `form_responses/${courseId}` but actual implementation uses `students/{studentId}/formResponses/{responseId}`.

**Fix Approach:**
- Update documentation to reflect actual sub-collection path
- Add note about relationship between students and their form responses

### Task 8: Fix Firestore Rules - Restrict Delete Permission

**Files:**
- Modify: `firestore.rules:33`

**Analysis:** `allow delete: if isSignedIn()` allows any authenticated user to delete any student.

**Fix Approach:**
- Change to `allow delete: if request.auth.uid == resource.data.teacherId` or similar ownership check
- Add validation that user owns the resource before delete

### Task 9: Fix Firestore Rules - Sociogram Security (Optional Review)

**Files:**
- Modify: `firestore.rules:81-96` (sociogram rules)

**Analysis:** Sociogram collections have `allow read/write: if true` - intentionally for server-side import but potentially insecure.

**Fix Approach:**
- If server-side only, add comment explaining why it's open
- If user-facing, add proper auth checks

---

## Phase 3: High Priority (Frontend Architecture)

### Task 10: Extract Modals from Students.tsx

**Files:**
- Create: `src/components/AddStudentModal.tsx`
- Create: `src/components/ImportStudentsModal.tsx`
- Create: `src/components/StudentProfileModal.tsx`
- Modify: `src/pages/Students.tsx` (remove modal code, import new components)
- Modify: `src/components/StudentProfileModal.tsx` (extract from Students.tsx lines 496-770)

**Analysis:** Students.tsx is 41KB+ containing 3 modal components mixed with main list view.

**Fix Approach:**
- Extract AddStudentModal to separate file
- Extract ImportStudentsModal to separate file
- Extract StudentProfileModal (with its 5 tabs) to separate file
- Import new components in Students.tsx

### Task 11: Create Shared Constants

**Files:**
- Create: `src/lib/constants.ts`
- Modify: `src/components/YearSelector.tsx:10` (use constant)
- Modify: `src/pages/Sociogram.tsx:205` (use constant)
- Modify: `src/pages/CourseLife.tsx:16` (use constant)
- Modify: `src/pages/StudentLife.tsx:15` (use constant)
- Modify: `src/pages/Projects.tsx:10` (use constant)
- Modify: `src/pages/Spiritual.tsx:10` (use constant)

**Fix Approach:**
- Create `src/lib/constants.ts` with:
  ```typescript
  export const DEFAULT_COURSE_ID = 'course-1';
  export const DEFAULT_STUDENT_ID = 'student-1';
  export const DEFAULT_YEARS = [2024, 2025, 2026, 2027] as const;
  ```
- Update all hardcoded references to use these constants

### Task 12: Standardize AI Endpoint Naming

**Files:**
- Modify: Various files using inconsistent AI endpoint prefixes

**Analysis:** Some files use `/api/ai/*` and others use `/api/generate/*`.

**Fix Approach:**
- Decide on consistent naming (recommend `/api/ai/*` for all AI endpoints)
- Update all calls to use consistent prefix:
  - `CourseNarrative.tsx:53` → `/api/generate/course-narrative` → `/api/ai/course-narrative`
  - `StudentJourney.tsx:94` → `/api/generate/student-narrative` → `/api/ai/student-narrative`
  - `Students.tsx:177` → already `/api/ai/analyze-risk` ✓
  - `Students.tsx:258` → already `/api/ai/summarize-student` ✓
  - `Dashboard.tsx:144` → `/api/ai/generate-report` ✓
  - `StudentGrowthTimeline.tsx:42` → already `/api/ai/generate-growth-narrative` ✓
  - `Sociogram.tsx:86` → `/api/regenerate-course-vision` (keep as is, not AI generation)

### Task 13: Create Data Fetching Custom Hooks

**Files:**
- Create: `src/hooks/useStudents.ts`
- Create: `src/hooks/useCourseData.ts`
- Create: `src/hooks/useFormResponses.ts`

**Analysis:** Each page re-implements Firestore listener patterns, leading to inconsistency.

**Fix Approach:**
- `useStudents(courseId?: string)` - returns students array, loading, error
- `useCourseData(courseId: string)` - returns course data, stats computed
- `useFormResponses(studentId: string)` - returns form responses with type filtering
- Update Dashboard, CourseLife, Students, StudentLife to use these hooks

### Task 14: Add Error Boundary Component

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/App.tsx` (wrap routes with ErrorBoundary)

**Fix Approach:**
- Create ErrorBoundary component that catches React errors and displays fallback UI
- Wrap main routes in App.tsx with ErrorBoundary
- Use consistent error display across all pages

---

## Phase 4: Medium Priority (Type Safety & Data Integrity)

### Task 15: Add Missing TypeScript Types

**Files:**
- Modify: `src/types/index.ts` (add SociogramAnalysis type)
- Create: `src/types/narratives.ts` (student/course narrative types)

**Analysis:** `sociogram_analysis_XXXX` and `students/{id}/narratives` collections have no TypeScript type.

**Fix Approach:**
- Add `SociogramAnalysis` type to `src/types/index.ts`:
  ```typescript
  export interface SociogramAnalysis {
    courseId: string;
    year: number;
    generatedAt: Timestamp;
    courseVision: string;
    summary: string;
    keyInsights: string[];
    studentDistribution: StudentDistribution[];
    riskAssessment: RiskAssessment;
  }
  ```
- Add `StudentNarrative` and `CourseNarrative` types to new file

### Task 16: Fix StudentJourney.tsx - Hardcoded Field Accessors

**Files:**
- Modify: `src/components/StudentJourney.tsx:25-29` (MOMENT_DATES)
- Modify: `src/components/StudentJourney.tsx:58,68,78` (field accessors)

**Analysis:** Hardcoded dates like `'inicio_III_medio': 'Marzo 2024'` and field accessors like `response.responses.emotional.estres` silently fail on schema mismatch.

**Fix Approach:**
- Move MOMENT_DATES to constants.ts or make it configurable via props
- Add validation for field accessors with fallback values
- Add TypeScript type guards for nested field access

### Task 17: Remove Dead Code - fin_i_semestre

**Files:**
- Modify: `src/lib/csvParser.ts:147` (dead code branch)
- Modify: `server.ts` (check if fin_i_semestre handling is needed)

**Analysis:** `fin_i_semestre` form type is handled in csvParser but never used in the batch import (which only accepts 3 types).

**Fix Approach:**
- If `fin_i_semestre` is a valid form type for future use, keep the code but add comment explaining it's for future
- If truly dead code, remove the branch to reduce confusion
- Update FormType union in types if needed

### Task 18: Fix YearSelector Component

**Files:**
- Modify: `src/components/YearSelector.tsx` (remove duplicate DEFAULT_YEARS)
- Modify: `src/components/YearSelector.tsx:18` (remove unnecessary sort)

**Analysis:** DEFAULT_YEARS defined both inline and as constant. Line 18 comment about immutable sort is unnecessary.

**Fix Approach:**
- Use shared constant from constants.ts
- Remove the unnecessary `[...availableYears].sort()` since availableYears is already sorted

---

## Phase 5: Medium Priority (UI Consistency)

### Task 19: Standardize Loading States

**Files:**
- Create: `src/components/LoadingSpinner.tsx`
- Modify: `Dashboard.tsx:138-158` (add spinner during AI generation)
- Modify: `Students.tsx:747-752` (improve loading state)
- Modify: various pages

**Analysis:** Some pages show spinners during AI generation, others just change button text.

**Fix Approach:**
- Create reusable LoadingSpinner component
- Update all AI generation buttons to show spinner and disable properly
- Standardize loading state display across CourseNarrative, StudentJourney, Dashboard, Students

### Task 20: Add Route Protection After Auth

**Files:**
- Modify: `src/App.tsx:42-47` (add route protection)

**Analysis:** Once logged in, all pages are accessible without additional checks.

**Fix Approach:**
- Create `ProtectedRoute` component that checks auth state
- Wrap authenticated routes with ProtectedRoute
- Add redirect to login if user tries to access protected route without auth

### Task 21: Fix Dashboard Course Filtering

**Files:**
- Modify: `src/pages/Dashboard.tsx:30` (add courseId filter)

**Analysis:** Dashboard queries ALL students, not filtered by course.

**Fix Approach:**
- Add courseId filter to students query
- Or add tab/selector for switching between courses
- Ensure stats are computed only for relevant course

---

## Phase 6: Minor Improvements (Cleanup)

### Task 22: Clean Up Dead Code in csvParser.ts

**Files:**
- Modify: `src/lib/csvParser.ts` (remove or document fin_i_semestre)

### Task 23: Add CourseId Constant Usage

**Files:**
- Update all files using 'course-1' to use DEFAULT_COURSE_ID constant

### Task 24: Update Dashboard Navigation Buttons

**Files:**
- Modify: `src/pages/Students.tsx:350-410` (add navigation or remove dead buttons)

### Task 25: Document Sociogram Open Rules

**Files:**
- Modify: `firestore.rules` (add comments explaining open rules for sociogram)

---

## Execution Order

The recommended execution order minimizes dependencies:

1. **Task 1, 2** (Dashboard/CourseLife hardcoded stats) - Can start immediately
2. **Task 4** (CourseLife listener cleanup) - Small, isolated
3. **Task 11** (shared constants) - Many tasks depend on this
4. **Task 6, 7** (CLAUDE.md updates) - Can be done anytime, before commit
5. **Task 5** (AI provider docs) - Before commit
6. **Task 3** (Firebase config) - Important but isolated
7. **Tasks 10, 12, 13, 14** (architecture improvements)
8. **Tasks 15-21** (medium priority)
9. **Tasks 22-25** (minor cleanup)

---

## Verification Checklist

After completing all tasks, verify:
- [ ] Dashboard shows real stats from Firestore
- [ ] CourseLife shows real stats from Firestore
- [ ] Firebase client and server use same database
- [ ] All listeners properly cleaned up
- [ ] CLAUDE.md reflects actual implementation
- [ ] All AI endpoints use consistent naming
- [ ] Error boundary catches React errors
- [ ] Students.tsx is split into smaller files
- [ ] No hardcoded courseId/year values
- [ ] Loading states consistent across pages
- [ ] Route protection works
- [ ] Firestore rules properly restrict delete