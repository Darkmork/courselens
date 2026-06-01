# Sociogram Vision-Based Relation Extraction

> **Spec:** Process group PDF directly with deepseek-vl2 to extract visual relationship data (arrows, colors, line types). Individual report remains as markdown.

## Problem Statement

Current sociogram import:
- Accepts only markdown files for both group and individual
- Markdown loses visual graph information (arrows, colors, line types)
- `relaciones` array is always empty → cohesion/fragmentation metrics are always wrong (0/10, 100%)

**Root cause:** The group PDF contains visual sociogram pages (2-3) with:
- Directed arrows between students (who chose whom)
- Line colors/types indicating relationship type (positive/negative)
- These visual elements are lost when converting PDF → markdown

## Proposed Solution

### Flow

```
Group PDF ──► Extract pages 2-3 as images
                 │
                 ▼
            deepseek-vl2 ──► Extract relationships (from_id, to_id, tipo, fuerza)
                 │
                 ▼
Individual Markdown ──► deepseek-chat ──► Student data (names, autoreporte, menciones)
                 │
                 ▼
            Combine & Calculate Metrics
                 │
                 ▼
            Firestore (sociogram_{year}/{courseId})
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/ImportSociogram.tsx` | Accept `.pdf` for group, keep `.md` for individual |
| `server.ts:222-358` | Accept `groupPdf` (PDF), use PDF parsing with VL2 |
| `src/lib/pulsoParser.ts` | Add `extractGroupPDFWithVision()`, `extractRelationsWithVL2()` |

### API Change

**Old request:**
```
FormData: groupMarkdown (.md), individualMarkdown (.md), year, courseId
```

**New request:**
```
FormData: groupPdf (.pdf), individualMarkdown (.md), year, courseId
```

### Response (unchanged)
```json
{
  "success": true,
  "summary": {
    "studentCount": 35,
    "relationCount": 89,
    "metrics": { "cohesion": 6.5, "fragmentacion": 12.3, ... }
  }
}
```

## Implementation Details

### 1. Frontend Change (ImportSociogram.tsx)

**Line 48:** Change file validation:
```typescript
// Old: only .md files
if (!file.type.includes('text') && !file.name.endsWith('.md')) {

// New: accept .pdf for group
if (file.name.endsWith('.pdf')) {
  // Accept PDF
} else if (!file.type.includes('text') && !file.name.endsWith('.md')) {
  // Error
}
```

**Line 101-102:** Change FormData key:
```typescript
// Old
formData.append('groupMarkdown', groupMarkdown);

// New
formData.append('groupPdf', groupPdf);
```

### 2. Backend Changes (server.ts)

**Line 234:** Accept `groupPdf` instead of `groupMarkdown`:
```typescript
if (!req.files?.groupPdf || !req.files?.individualMarkdown) {
  return res.status(400).json({ error: "..." });
}
```

**Line 249:** PDF file handling:
```typescript
const groupPdfFile = req.files.groupPdf as UploadedFile;
```

**After line 258:** Add PDF → image extraction + VL2 analysis:
```typescript
// Extract relationships from group PDF with vision AI
const relations = await extractRelationsFromPDF(
  groupPdfFile.data,
  studentNames, // from markdown parsing
  deepseekApiKey
);
```

### 3. pulsoParser.ts Changes

Add two new functions:

**`extractGroupPDFWithVision(pdfBuffer, studentNames, apiKey)`**
- Uses pdfjs-dist to extract pages 2-3 as images
- Converts to base64 JPEG
- Calls `extractRelationsWithVL2` for each page
- Returns relations array

**`extractRelationsWithVL2(imageBase64, studentNames, apiKey)`**
- Sends image to `deepseek-chat` model with vision
- Prompt describes:
  - Solid green lines = trabajo_positivo
  - Dashed green lines = convivencia_positiva
  - Solid red lines = trabajo_negativo
  - Dashed red lines = convivencia_negativa
- Returns array of `{ from_id, to_id, tipo, fuerza }`

### 4. Metrics Calculation

With actual relations, metrics will work:
- `cohesion` = real connections / possible connections * 10
- `fragmentacion` = % students with 0 connections

## Edge Cases

1. **User still uploads markdown for group**
   - Show error: "Group report must be PDF to extract relationship data"
   - Or gracefully fall back to text-only (but warn metrics will be wrong)

2. **PDF pages 2-3 missing or unreadable**
   - Log warning, continue with empty relations
   - Show warning to user that relationship metrics couldn't be extracted

3. **deepseek-vl2 fails**
   - Catch error, fall back to empty relations
   - Don't fail entire import, just skip relationship extraction

## Testing Checklist

- [ ] Import group PDF → relations extracted correctly
- [ ] Import group markdown only → error shown (PDF required)
- [ ] Relations count > 0 displayed in ImportSociogram success
- [ ] Cohesion score is realistic (not 0/10)
- [ ] Fragmentation score is realistic (not 100%)
- [ ] Student names in relations match actual students
- [ ] Line colors correctly mapped to relationship types

## Cost Estimate

- Group PDF page extraction: ~$0.01 (local processing)
- VL2 vision analysis: ~$0.02-0.05 per page (2 pages = $0.04-0.10)
- Individual markdown: ~$0.02 (text only)
- **Total: ~$0.05-0.15 per import** (vs $0.00 now but broken)

Token cost is low. The previous "avoid token costs" was a misjudgment - the data is fundamentally broken without relations.