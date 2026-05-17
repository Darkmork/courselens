# DeepSeek Migration Design

**Date:** 2026-05-16  
**Scope:** Replace Google Gemini AI with DeepSeek API for cost optimization  
**Impact:** Backend only (server.ts)

---

## Overview

ClassSphere currently uses Google Gemini 1.5 Flash for three AI-powered features:
- Student risk assessment (`/api/ai/analyze-risk`)
- Parent meeting summaries (`/api/ai/summarize-student`)
- Course health reports (`/api/ai/generate-report`)

DeepSeek offers significantly lower token costs while maintaining equivalent functionality. This migration replaces the Gemini client with OpenAI-compatible DeepSeek API calls, leveraging the `openai` SDK for consistency and maintainability.

---

## Changes Required

### 1. Dependencies (package.json)

**Remove:**
- `@google/genai` (no longer needed)

**Add:**
- `openai` (for DeepSeek API compatibility)

**Why OpenAI SDK?**
- DeepSeek's API is OpenAI-compatible, allowing direct use of the `openai` package
- More mature, better documented, and widely adopted
- If future migrations are needed, switching providers becomes trivial
- Reduces technical debt vs. raw HTTP calls

### 2. Server Configuration (server.ts)

**Current (Gemini):**
```typescript
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const result = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt
});
```

**New (DeepSeek):**
```typescript
const ai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const result = await ai.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: prompt }],
  temperature: 1,
});

const text = result.choices[0].message.content;
```

**Key Differences:**
- Client initialization points to DeepSeek's base URL
- API uses `chat.completions.create()` with message format instead of `generateContent()`
- Response structure changes from `result.text` to `result.choices[0].message.content`
- Temperature defaults to 1 (DeepSeek's recommended default)

### 3. All Three Endpoints

The same OpenAI client handles all three endpoints without modification to business logic:
- `/api/ai/analyze-risk` — Returns JSON risk assessment
- `/api/ai/summarize-student` — Returns Markdown summary
- `/api/ai/generate-report` — Returns Markdown report

JSON/Markdown parsing logic remains unchanged because DeepSeek returns plain text identical to Gemini.

### 4. Environment Configuration

**Update .env.example:**
```
DEEPSEEK_API_KEY="your-deepseek-api-key"
APP_URL="your-app-url"
```

Users will set `DEEPSEEK_API_KEY` in their `.env.local` instead of `GEMINI_API_KEY`.

---

## Migration Steps Summary

1. Update `package.json`: remove `@google/genai`, add `openai`
2. Rewrite Gemini client initialization in `server.ts` with OpenAI client
3. Convert all `generateContent()` calls to `chat.completions.create()`
4. Extract text from `result.choices[0].message.content` instead of `result.text`
5. Update `.env.example` with `DEEPSEEK_API_KEY`
6. No changes to frontend, routing, or data models
7. Test all three AI endpoints locally

---

## Testing Plan

- **Unit:** Each endpoint returns valid JSON or Markdown (same as before)
- **Integration:** Risk assessment, summaries, and reports generate correctly with sample data
- **Smoke test:** Run dev server, trigger each AI feature, verify responses parse correctly

---

## Rollback

If issues arise:
- Revert to `@google/genai` by reversing the `package.json` and `server.ts` changes
- No database or frontend changes exist, so rollback is safe

---

## Notes

- This is a direct 1:1 replacement; no feature changes
- All prompts remain in Spanish, outputs format unchanged
- Future AI features can reuse the same DeepSeek client without modification
