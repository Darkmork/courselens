# ClassSphere Light Design - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ClassSphere from dark theme to a clean, professional light theme inspired by Wero Wallet (#0066CC blue + #FF6B35 orange).

**Architecture:** The implementation follows a "base then components" approach: first update CSS variables and base styles in index.css, then update each component/page to use the new theme. Layout.tsx (sidebar) is updated first as it's the shell for all pages.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite

---

## File Structure & Dependencies

| File | Changes | Dependencies |
|------|---------|--------------|
| `src/index.css` | CSS variables, theme, base styles | None (base) |
| `src/components/Layout.tsx` | Sidebar, navigation, header | After index.css |
| `src/components/Login.tsx` | Login card, button, background | After index.css |
| `src/pages/Dashboard.tsx` | Cards, grids, metrics | After Layout |
| `src/pages/Students.tsx` | Table, modals, list | After Layout |
| `src/pages/Sociogram.tsx` | Table, cards | After Layout |
| `src/pages/CourseLife.tsx` | Tabs, narrative sections | After Layout |
| `src/pages/StudentLife.tsx` | Timeline, journey | After Layout |
| `src/pages/Conflicts.tsx` | Alert cards | After Layout |
| `src/pages/Projects.tsx` | Cards, list | After Layout |
| `src/pages/Spiritual.tsx` | Sessions, cards | After Layout |
| `src/pages/ImportForms.tsx` | Forms, buttons | After Layout |
| `src/pages/ImportSociogram.tsx` | Upload, cards | After Layout |

---

## Task 1: Update CSS Variables and Base Styles in index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Read current index.css**

Read the first 80 lines of `src/index.css` to see current structure.

- [ ] **Step 2: Replace dark CSS variables with light theme**

Replace the existing `:root` variables with:

```css
:root {
  /* Primary Blue */
  --color-primary: #0066CC;
  --color-primary-dark: #004C99;
  --color-primary-light: #F0F7FF;
  --color-primary-50: #F0F7FF;
  --color-primary-100: #E0EFF9;

  /* Accent Orange */
  --color-accent: #FF6B35;
  --color-accent-dark: #E55A2B;
  --color-accent-light: #FFF0EB;

  /* Backgrounds */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-bg-tertiary: #FAFAFA;

  /* Text */
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-text-inverse: #FFFFFF;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Borders */
  --color-border: #E5E5E5;
  --color-border-hover: #D5D5D5;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

- [ ] **Step 3: Update body background and text**

Replace the dark body styles:

```css
/* Before (dark): */
body {
  background: #050505;
  color: #e5e5e5;
}

/* After (light): */
body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

- [ ] **Step 4: Remove dark glow effects**

Remove the dark glow effects from body::before (the blue/emerald orbs). Either delete or comment out:

```css
/* Remove or comment out:
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}
*/
```

- [ ] **Step 5: Update selection color**

```css
/* Update selection: */
::selection {
  background: rgba(0, 102, 204, 0.2);
}
```

- [ ] **Step 6: Update scrollbar for light theme**

Replace dark scrollbar with:

```css
/* Scrollbar - light theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #D5D5D5;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #B5B5B5;
}
```

- [ ] **Step 7: Add Google Fonts import**

Add at the top of the file:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

- [ ] **Step 8: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors (CSS changes don't affect TS)

- [ ] **Step 9: Commit**

```bash
git add src/index.css
git commit -m "feat(design): Add ClassSphere Light CSS variables and theme"
```

---

## Task 2: Update Layout.tsx - Sidebar and Navigation

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Read current Layout.tsx**

Read the first 100 lines to understand structure.

- [ ] **Step 2: Update sidebar background and border**

Find the sidebar div and update styles:

```tsx
// Find: className="fixed left-0 top-0 h-full w-72 bg-neutral-950/80 backdrop-blur-xl border-r border-white/5"
// Replace with:
className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-md"
```

- [ ] **Step 3: Update logo text color**

Find the logo text "ClassSphere" and update:

```tsx
// Find: className="text-2xl font-bold text-white font-display tracking-tight"
// Replace with:
className="text-2xl font-bold text-primary font-display tracking-tight"
```

- [ ] **Step 4: Update navigation item styles**

Find the nav item mapping and update each item's styling:

```tsx
// For default state:
className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors"

// Replace with:
className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
```

- [ ] **Step 5: Update active navigation item**

Find the active nav item styling (the one with `isActive` check):

```tsx
// Find: className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-neutral-400 hover:text-white'}`}
// Replace with:
className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary-50 text-primary border-l-4 border-primary font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
```

- [ ] **Step 6: Update user section**

Find the user profile section at bottom:

```tsx
// Update avatar background:
className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-semibold"

// Replace with:
className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-semibold"
```

- [ ] **Step 7: Update logout button**

```tsx
// Find: className="text-neutral-500 hover:text-red-400 transition-colors"
// Replace with:
className="text-gray-500 hover:text-red-600 transition-colors"
```

- [ ] **Step 8: Update main content area**

Find the main content div and update:

```tsx
// Find: className="flex-1 relative z-10 overflow-auto h-[100dvh] bg-neutral-950"
// Replace with:
className="flex-1 relative z-10 overflow-auto h-[100dvh] bg-gray-50"
```

- [ ] **Step 9: Remove dark glow effects from main**

Remove any dark background gradients or glows in the main content area.

- [ ] **Step 10: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 11: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat(design): Update Layout sidebar to ClassSphere Light theme"
```

---

## Task 3: Update Login.tsx - Login Card and Button

**Files:**
- Modify: `src/components/Login.tsx`

- [ ] **Step 1: Read current Login.tsx**

Read first 80 lines.

- [ ] **Step 2: Update page background**

Find body/container styling and update:

```tsx
// Find: className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden"
// Replace with:
className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden"
```

- [ ] **Step 3: Remove dark glow effects**

Remove the blue/emerald glow divs (body::before was in CSS, but there may be overlays in JSX too).

- [ ] **Step 4: Update card background**

Find the card div:

```tsx
// Find: className="relative w-full max-w-md bg-neutral-900/80 backdrop-blur-2xl rounded-[1.4rem] border border-white/5 p-10 shadow-2xl"
// Replace with:
className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 p-10 shadow-lg"
```

- [ ] **Step 5: Update title color**

```tsx
// Find: className="text-5xl font-display font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent text-center"
// Replace with:
className="text-5xl font-display font-bold text-primary text-center"
```

- [ ] **Step 6: Update tagline**

```tsx
// Find: className="text-center text-neutral-400 font-mono text-sm mt-2"
// Replace with:
className="text-center text-gray-500 font-mono text-sm mt-2"
```

- [ ] **Step 7: Update Google button**

Find the Google auth button:

```tsx
// Find: className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
// Replace with:
className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
```

- [ ] **Step 8: Update Google icon color**

The Google icon should remain colored (it's an image), no change needed.

- [ ] **Step 9: Update footer text**

```tsx
// Find: className="text-center text-neutral-600 text-xs font-mono mt-8"
// Replace with:
className="text-center text-gray-400 text-xs font-mono mt-8"
```

- [ ] **Step 10: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 11: Commit**

```bash
git add src/components/Login.tsx
git commit -m "feat(design): Update Login page to ClassSphere Light theme"
```

---

## Task 4: Update Dashboard.tsx - Cards, Grids, Metrics

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Read current Dashboard.tsx**

Read first 120 lines to understand structure.

- [ ] **Step 2: Update page background**

Find the main container:

```tsx
// Find: className="min-h-screen bg-neutral-950 text-white"
// Replace with:
className="min-h-screen bg-gray-50 text-gray-900"
```

- [ ] **Step 3: Update header text**

Find "Buenos días" heading:

```tsx
// Find: className="text-4xl font-display font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent"
// Replace with:
className="text-4xl font-display font-bold text-gray-900"
```

- [ ] **Step 4: Update subtitle**

```tsx
// Find: className="flex items-center gap-2 text-emerald-400 font-mono text-sm"
// Replace with:
className="flex items-center gap-2 text-primary font-mono text-sm"
```

- [ ] **Step 5: Update AI Report button**

Find the AI Report button:

```tsx
// Find: className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono text-sm rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
// Replace with:
className="px-6 py-3 bg-accent text-white font-semibold text-sm rounded-xl hover:bg-accent-dark transition-all flex items-center gap-2 shadow-md"
```

- [ ] **Step 6: Update health scorecards**

Find the scorecard grid and cards:

```tsx
// Grid: Change 4-column to use proper responsive classes
// Cards: bg-neutral-950/50 → bg-white
// Borders: border-white/5 → border-gray-200
// Text: White text → gray-900 for titles, gray-600 for labels
// Shadows: Add shadow-sm
```

For each scorecard (Academic, Relational, Emotional, Growth):

```tsx
// Find: className="bg-neutral-950/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative overflow-hidden"
// Replace with:
className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
```

- [ ] **Step 7: Update risk distribution card**

```tsx
// Find: className="bg-neutral-950/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6"
// Replace with:
className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
```

- [ ] **Step 8: Update alert cards**

Find the alerts section:

```tsx
// Card backgrounds: bg-neutral-950/50 → bg-white
// Borders: border-white/5 → border-gray-200
// Text: white → gray-900 for headings
// Left border colors: keep but adjust opacity
```

- [ ] **Step 9: Update CourseLife action cards**

The 3 cards at bottom (Import Forms, Course Narrative, Student Profiles):

```tsx
// Background: Keep gradient but adjust to light theme
// Example: from-blue-600/20 → from-blue-50 to-white
// Text: Adjust if using emojis, keep readable
```

- [ ] **Step 10: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 11: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(design): Update Dashboard to ClassSphere Light theme"
```

---

## Task 5: Update Students.tsx - Table, Modals, List

**Files:**
- Modify: `src/pages/Students.tsx`

- [ ] **Step 1: Read current Students.tsx**

Read first 100 lines.

- [ ] **Step 2: Update page background**

```tsx
// Find: className="min-h-screen bg-neutral-950 text-white"
// Replace with:
className="min-h-screen bg-gray-50 text-gray-900"
```

- [ ] **Step 3: Update header**

```tsx
// Title: text-white → text-gray-900
// Subtitle: text-neutral-400 → text-gray-500
```

- [ ] **Step 4: Update search input**

```tsx
// Find: className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
// Replace with:
className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pl-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
```

- [ ] **Step 5: Update table**

Find the table element:

```tsx
// Table container: bg-neutral-950/50 → bg-white
// Header: bg-neutral-900 → bg-gray-50
// Header text: text-neutral-400 → text-gray-600, uppercase
// Row borders: border-white/5 → border-gray-200
// Row hover: bg-neutral-800/30 → bg-gray-50
```

- [ ] **Step 6: Update buttons (Add Student, Import)**

```tsx
// Add button: bg-blue-600 → bg-primary
// Import button: border-white/10 → border-gray-300, text-neutral-300 → text-gray-600
```

- [ ] **Step 7: Update modals**

For AddStudentModal, ImportStudentsModal, StudentProfileModal (if still in this file after Task 10 extraction):

```tsx
// Modal backdrop: bg-black/50 → bg-black/40
// Modal card: bg-neutral-900 → bg-white, border-white/5 → border-gray-200
// Modal headers: text-white → text-gray-900
// Form inputs: match search input styling
// Close button: text-neutral-400 → text-gray-400
```

- [ ] **Step 8: Update tabs**

If using tabs (Crecimiento, etc.):

```tsx
// Tab container: border-b border-white/10 → border-b border-gray-200
// Active tab: text-blue-400 border-b-2 border-blue-400 → text-primary border-b-2 border-primary
// Inactive tab: text-neutral-400 → text-gray-500
```

- [ ] **Step 9: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 10: Commit**

```bash
git add src/pages/Students.tsx
git commit -m "feat(design): Update Students page to ClassSphere Light theme"
```

---

## Task 6: Update Sociogram.tsx - Table, Cards

**Files:**
- Modify: `src/pages/Sociogram.tsx`

- [ ] **Step 1: Read current Sociogram.tsx**

Read first 100 lines.

- [ ] **Step 2: Apply similar changes to Dashboard**

- Page background: bg-neutral-950 → bg-gray-50
- Cards: bg-neutral-950/50 → bg-white, border-white/5 → border-gray-200
- Text: white → gray-900, neutral-400 → gray-500
- Shadows: add shadow-sm to cards

- [ ] **Step 3: Update YearSelector**

The YearSelector component should also update:

```tsx
// Tab buttons: bg-neutral-800 → bg-gray-100
// Active tab: text-blue-400 → text-primary
// Inactive tab: text-neutral-400 → text-gray-500
```

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/Sociogram.tsx
git commit -m "feat(design): Update Sociogram page to ClassSphere Light theme"
```

---

## Task 7: Update CourseLife.tsx and StudentLife.tsx

**Files:**
- Modify: `src/pages/CourseLife.tsx`
- Modify: `src/pages/StudentLife.tsx`

- [ ] **Step 1: Read both files**

Read each first 80 lines.

- [ ] **Step 2: Update CourseLife.tsx**

Apply same pattern:
- Background: bg-neutral-950 → bg-gray-50
- Cards: bg-neutral-950/50 → bg-white
- Tabs: active blue → primary blue

- [ ] **Step 3: Update StudentLife.tsx**

Same pattern:
- Background: bg-neutral-950 → bg-gray-50
- Cards: bg-neutral-950/50 → bg-white
- Timeline: adjust dot colors for light theme

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/CourseLife.tsx src/pages/StudentLife.tsx
git commit -m "feat(design): Update CourseLife and StudentLife pages to ClassSphere Light theme"
```

---

## Task 8: Update Remaining Pages

**Files:**
- Modify: `src/pages/Conflicts.tsx`
- Modify: `src/pages/Projects.tsx`
- Modify: `src/pages/Spiritual.tsx`
- Modify: `src/pages/ImportForms.tsx`
- Modify: `src/pages/ImportSociogram.tsx`

- [ ] **Step 1: Apply same pattern to each page**

For each page:
1. Background: bg-neutral-950 → bg-gray-50 (or bg-white for contained layouts)
2. Cards: bg-neutral-950/50 → bg-white, add shadow-sm
3. Text: white → gray-900, neutral-400 → gray-500
4. Buttons: adjust to primary blue or accent orange
5. Borders: border-white/5 → border-gray-200

- [ ] **Step 2: Run lint after each**

Run: `npm run lint` after each file modification
Expected: No TypeScript errors

- [ ] **Step 3: Commit after all**

```bash
git add src/pages/Conflicts.tsx src/pages/Projects.tsx src/pages/Spiritual.tsx src/pages/ImportForms.tsx src/pages/ImportSociogram.tsx
git commit -m "feat(design): Update remaining pages to ClassSphere Light theme"
```

---

## Task 9: Update Components

**Files:**
- Modify: `src/components/YearSelector.tsx` (if not done in Task 6)
- Modify: `src/components/StudentGrowthTimeline.tsx`
- Modify: `src/components/FormResponseCard.tsx`
- Modify: `src/components/CourseNarrative.tsx`
- Modify: `src/components/StudentJourney.tsx`
- Modify: `src/components/LoadingSpinner.tsx`
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/components/ProtectedRoute.tsx`
- Modify: `src/components/AddStudentModal.tsx`
- Modify: `src/components/ImportStudentsModal.tsx`
- Modify: `src/components/StudentProfileModal.tsx`

- [ ] **Step 1: Apply light theme to each component**

Apply same pattern to any component that uses dark theme:
- Backgrounds: dark → white/gray
- Text: white → gray-900
- Borders: white/5 → gray-200
- Shadows: add where appropriate

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/YearSelector.tsx src/components/StudentGrowthTimeline.tsx src/components/FormResponseCard.tsx src/components/CourseNarrative.tsx src/components/StudentJourney.tsx src/components/LoadingSpinner.tsx src/components/ErrorBoundary.tsx src/components/ProtectedRoute.tsx src/components/AddStudentModal.tsx src/components/ImportStudentsModal.tsx src/components/StudentProfileModal.tsx
git commit -m "feat(design): Update components to ClassSphere Light theme"
```

---

## Task 10: Final Verification

**Files:**
- No file changes - verification only

- [ ] **Step 1: Run full lint check**

Run: `npm run lint`
Expected: No TypeScript errors

- [ ] **Step 2: Check for any remaining dark elements**

Search for `bg-neutral-950`, `bg-neutral-900`, `text-white`, `border-white/`

Run: `grep -r "bg-neutral-950\|bg-neutral-900" src/ --include="*.tsx" | head -20`
Expected: No results (or only intentional dark elements like disabled states)

- [ ] **Step 3: Test in browser**

If possible, run `npm run dev` and visually verify the light theme is applied correctly.

- [ ] **Step 4: Commit verification**

```bash
git commit -m "chore(design): Verify ClassSphere Light theme implementation"
```

---

## Execution Order

1. **Task 1** (CSS variables) - Foundation, must be first
2. **Task 2** (Layout) - Shell for all pages
3. **Task 3** (Login) - First user-facing page
4. **Task 4** (Dashboard) - Main page
5. **Task 5** (Students) - Complex page with table
6. **Task 6** (Sociogram) - Table page
7. **Task 7** (CourseLife/StudentLife) - Tabbed pages
8. **Task 8** (Remaining pages) - Conflicts, Projects, etc.
9. **Task 9** (Components) - Shared components
10. **Task 10** (Verification) - Final check

---

## Success Criteria

- [ ] All pages have white/gray backgrounds (not dark)
- [ ] Primary blue (#0066CC) used for CTAs and active states
- [ ] Orange accent (#FF6B35) used for important actions
- [ ] Text is readable (dark on light)
- [ ] Navigation clearly shows active state with blue
- [ ] Cards have subtle shadows and borders
- [ ] No dark elements remain except intentional
- [ ] TypeScript compiles without errors
- [ ] All functionality works correctly