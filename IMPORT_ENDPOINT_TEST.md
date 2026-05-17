# POST /api/import/sociogram - Endpoint Testing Guide

## Task 4 Implementation: Import API Endpoint

This document describes how to test the new `/api/import/sociogram` endpoint for PULSO.cl PDF imports.

## Endpoint Specification

**URL:** `POST http://localhost:3000/api/import/sociogram`

**Content-Type:** `multipart/form-data`

### Request Format

**Form Fields:**
- `groupPdf` (file) - PULSO.cl group PDF report
- `individualPdf` (file) - PULSO.cl individual PDF report  
- `year` (string) - Academic year (e.g., "2025")
- `courseId` (string) - Course identifier (e.g., "default-course")

### Success Response (200)

```json
{
  "success": true,
  "message": "Sociograma 2025 imported successfully",
  "summary": {
    "year": 2025,
    "courseId": "default-course",
    "studentCount": 28,
    "relationCount": 142,
    "metrics": {
      "cohesion": 5.42,
      "fragmentacion": 7.14,
      "liderazgo_promedio": 4.2,
      "aislamiento_promedio": 10.5
    }
  }
}
```

### Error Responses

**Missing Files (400):**
```json
{
  "error": "Both groupPdf and individualPdf are required",
  "status": "validation_failed"
}
```

**Missing Parameters (400):**
```json
{
  "error": "year and courseId are required in request body",
  "status": "validation_failed"
}
```

**Student Mismatch (400):**
```json
{
  "error": "Student \"Juan Pérez\" found in individual PDF but not in group PDF",
  "status": "validation_failed"
}
```

**Server Error (500):**
```json
{
  "error": "Failed to import sociogram",
  "details": "Error message from parser or Firestore",
  "status": "error"
}
```

## Testing with curl

### Basic Test (requires actual PDF files)

```bash
curl -X POST http://localhost:3000/api/import/sociogram \
  -F "groupPdf=@/path/to/group.pdf" \
  -F "individualPdf=@/path/to/individual.pdf" \
  -F "year=2025" \
  -F "courseId=default-course"
```

### Test Missing Files (should fail with 400)

```bash
curl -X POST http://localhost:3000/api/import/sociogram \
  -F "year=2025" \
  -F "courseId=default-course"
```

### Test Missing Parameters (should fail with 400)

```bash
curl -X POST http://localhost:3000/api/import/sociogram \
  -F "groupPdf=@/path/to/group.pdf" \
  -F "individualPdf=@/path/to/individual.pdf"
```

## Testing with Postman

1. Create a new POST request to `http://localhost:3000/api/import/sociogram`
2. Set body to `form-data`
3. Add fields:
   - `groupPdf` (type: File) → select group.pdf
   - `individualPdf` (type: File) → select individual.pdf
   - `year` (type: Text) → "2025"
   - `courseId` (type: Text) → "default-course"
4. Click Send
5. Verify response matches expected success format

## Testing with Node.js Script

```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testImport() {
  const form = new FormData();
  
  // Add files (assuming they exist in current directory)
  form.append('groupPdf', fs.createReadStream('./group.pdf'));
  form.append('individualPdf', fs.createReadStream('./individual.pdf'));
  form.append('year', '2025');
  form.append('courseId', 'default-course');

  try {
    const response = await axios.post(
      'http://localhost:3000/api/import/sociogram',
      form,
      { headers: form.getHeaders() }
    );
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testImport();
```

## Implementation Details

### Files Modified/Created

1. **server.ts** - Added POST endpoint with:
   - File upload validation
   - PDF parsing via parseGroupPDF and parseIndividualPDF
   - Student name matching between files
   - Relation building and validation
   - Metrics calculation
   - Firestore document creation
   - Comprehensive error handling

2. **src/lib/sociogramMetrics.ts** - New utility with:
   - `calculateMetrics()` function
   - Cohesion calculation (actual/possible connections)
   - Fragmentation calculation (isolated students %)
   - Leadership average (positive mentions per student)
   - Isolation average (students with no mentions %)

3. **Dependencies Added:**
   - `express-fileupload` - For handling multipart file uploads
   - `pdfjs-dist` - For PDF parsing (already required by pulsoParser)
   - `@types/express-fileupload` - TypeScript type definitions

### Data Flow

1. **Receive** → Validate files and parameters
2. **Parse** → Extract data from both PDFs
3. **Merge** → Combine group relations with individual student details
4. **Validate** → Ensure students match between files
5. **Calculate** → Compute sociogram metrics
6. **Save** → Store complete SociogramData to Firestore
7. **Respond** → Return summary with counts and metrics

### Firestore Document Structure

Documents saved at: `sociogram_[YEAR]/[courseId]`

Example path: `sociogram_2025/default-course`

Structure:
```typescript
{
  year: number;
  courseId: string;
  estudiantes: StudentSociogramData[];  // 28+ students with detailed data
  relaciones: SociogramRelation[];      // 100+ directed relations
  metricas: SociogramMetrics;           // 4 calculated metrics
}
```

## Debugging

### Start dev server with logging:

```bash
npm run dev
```

The endpoint logs:
- Parsing progress (student counts per PDF)
- Validation results
- Relations created
- Firestore save confirmation

### Check Firestore directly:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Look for `sociogram_2025` collection
4. Open `default-course` document
5. Verify structure and data completeness

## Edge Cases Handled

- ✓ Missing PDF files
- ✓ Missing year/courseId parameters
- ✓ Student name mismatches between PDFs
- ✓ Empty or malformed PDFs
- ✓ File size limits (50MB max)
- ✓ Firestore write failures
- ✓ Student names with accents and special characters

## Performance Notes

- Parsing time: ~1-3 seconds per PDF (depending on size)
- Firestore write: ~500ms
- Total request time: ~2-5 seconds for typical files
- Memory: ~50MB for 50MB PDF files

## Known Limitations

- PDF parsing depends on PULSO.cl PDF structure consistency
- Relation building assumes specific student ordering in group PDF
- Metrics are calculated inline (no persistent metric history)
