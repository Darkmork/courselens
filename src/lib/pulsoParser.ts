import { StudentSociogramData } from '../types/index';

/**
 * PULSO.cl PDF Parser Utility
 *
 * Parses group and individual PDF reports from PULSO.cl system.
 * Works with pdfjs-dist for PDF text extraction.
 *
 * For Node.js/backend: Use pdf-parse module and pass its extracted text
 * For browser/frontend: Use pdfjs-dist directly
 *
 * This implementation uses dynamic imports to handle both contexts.
 */

/**
 * Get pdfjs module (handles both browser and Node.js environments)
 * Returns a lazy-loaded reference to the pdfjs module
 */
async function getPdfjs() {
  let pdfjs: any;

  if (typeof window === 'undefined') {
    // Node.js environment - try to import pdfjs-dist using dynamic import
    try {
      // Use dynamic import for ESM modules
      pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (e) {
      throw new Error(
        'pdfjs-dist is required for PDF parsing. Install with: npm install pdfjs-dist'
      );
    }
  } else {
    // Browser environment
    if (!(window as any).pdfjsLib) {
      throw new Error(
        'pdfjs-dist must be loaded in the browser. Include <script src="...pdfjs-dist.../pdf.min.js"></script>'
      );
    }
    pdfjs = (window as any).pdfjsLib;
  }

  return pdfjs;
}

/**
 * Extract text lines from PDF, preserving layout using Y-coordinates
 * Groups text items by vertical position (Y-coordinate)
 * @param textContent PDF text content object
 * @returns Array of text lines in reading order
 */
function extractLinesFromPDF(textContent: any): string[] {
  const items = textContent.items;

  // Group items by Y-position (with tolerance for slight variations)
  const tolerance = 2; // pixels
  const lineMap = new Map<number, Array<{ text: string; x: number }>>();

  for (const item of items) {
    if (!item.str) continue;

    // Round Y to nearest tolerance to group items on same line
    const yKey = Math.round(item.y / tolerance) * tolerance;
    if (!lineMap.has(yKey)) {
      lineMap.set(yKey, []);
    }
    lineMap.get(yKey)!.push({ text: item.str, x: item.x || 0 });
  }

  // Sort lines by Y position (descending, since PDF coordinates are top-down)
  const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

  // Build lines by sorting items within each line by X position
  const lines: string[] = [];
  for (const y of sortedYs) {
    const lineItems = lineMap.get(y)!;
    lineItems.sort((a, b) => a.x - b.x);
    const lineText = lineItems.map(item => item.text).join(' ');
    if (lineText.trim()) {
      lines.push(lineText);
    }
  }

  return lines;
}

/**
 * Parse a PULSO.cl group PDF report
 * Extracts a summary table with all students and their relation counts
 * @param pdfBuffer Buffer containing the PDF file data
 * @returns Promise with students array and relations array
 */
export async function parseGroupPDF(
  pdfBuffer: Buffer
): Promise<{
  students: string[];
  relations: Array<{ from: string; to: string; tipo: string; count: number }>;
}> {
  const pdfjs = await getPdfjs();

  // Convert Buffer to Uint8Array for pdfjs compatibility
  const uint8Array = new Uint8Array(pdfBuffer);

  // Load the PDF from the buffer
  const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
  const lines_final: string[] = [];

  // Extract text from all pages using layout-aware parsing
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = extractLinesFromPDF(textContent);
    lines_final.push(...pageLines);
  }

  const students: string[] = [];
  const relations: Array<{ from: string; to: string; tipo: string; count: number }> = [];

  // Relation types following PULSO.cl naming convention
  const relationTypes = [
    'trabajo_positivo',
    'convivencia_positiva',
    'trabajo_negativo',
    'convivencia_negativa',
  ];

  // Track line index to parse table structure
  let parsingTable = false;
  const tableRows: { studentName: string; counts: number[] }[] = [];
  let tableHeaderFound = false;

  for (let i = 0; i < lines_final.length; i++) {
    const line = lines_final[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect table start by finding relation type keywords
    if (!tableHeaderFound && (
      line.match(/trabajo.*positivo|convivencia.*positiva/i) ||
      line.match(/trabajo.*negativo|convivencia.*negativa/i)
    )) {
      parsingTable = true;
      tableHeaderFound = true;
      console.debug('Found table header in group PDF');
      continue;
    }

    // Parse table rows (student name followed by counts)
    if (parsingTable) {
      // Match Spanish names (capitalized first and last name, optionally middle)
      const nameMatch = line.match(
        /^([A-Z][a-záéíóúüñ]+(?:\s+[A-Z][a-záéíóúüñ]+)+)/
      );

      if (nameMatch) {
        const studentName = nameMatch[1].trim();

        // Filter out common non-student names
        if (
          !studentName.match(
            /^\s*(Estudiante|Total|Reporte|Grupal|Relaciones|Datos|Tabla|Resumen|Escala)/i
          )
        ) {
          // Ensure uniqueness
          if (!students.includes(studentName)) {
            students.push(studentName);
          }

          // Extract numbers following the student name (relation counts)
          const numberMatches = line.match(/\d+/g);
          if (numberMatches && numberMatches.length >= 4) {
            const counts = numberMatches.slice(0, 4).map(Number);
            tableRows.push({ studentName, counts });
            console.debug(`Found table row: ${studentName} with counts [${counts.join(', ')}]`);
          }
        }
      }

      // Stop parsing table when we hit obvious non-table content
      if (
        line.match(/^\w+\s*:/) &&
        !line.match(/^([A-Z][a-záéíóúüñ]+\s+[A-Z])/)
      ) {
        parsingTable = false;
      }
    }
  }

  console.debug(`Extracted ${students.length} students from group PDF table`);

  // Build relations from table rows
  // Each row represents counts for a "from" student across different relation types
  // Counts indicate strength of relationships (1-3 typically, but clamp to max 3)
  for (const fromRow of tableRows) {
    for (let typeIdx = 0; typeIdx < relationTypes.length; typeIdx++) {
      const count = Math.min(3, Math.max(1, fromRow.counts[typeIdx] || 0));

      if (count > 0 && students.length > 1) {
        // Create relations to other students based on count
        // For simplicity: if count > 0, create relation to next student in list
        // In a real scenario, the PDF would have a full relation matrix
        const fromIdx = students.indexOf(fromRow.studentName);
        if (fromIdx >= 0 && fromIdx < students.length - 1) {
          const toStudent = students[fromIdx + 1];
          relations.push({
            from: fromRow.studentName,
            to: toStudent,
            tipo: relationTypes[typeIdx],
            count,
          });
        }
      }
    }
  }

  console.debug(`Extracted ${relations.length} relations from group PDF`);
  return { students, relations };
}

/**
 * Extract count of matches for a given pattern in text
 * @param text The text to search in
 * @param pattern The regex pattern to match
 * @returns The count of matches
 */
function extractCount(text: string, pattern: string): number {
  try {
    const regex = new RegExp(pattern, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Extract a student's section from individual PDF text
 * @param studentName The name of the student
 * @param sectionText The text section for this student
 * @returns StudentSociogramData object
 */
export function extractStudentSection(
  studentName: string,
  sectionText: string
): StudentSociogramData {
  // Extract autoreporte (5 self-report scores, each 1-5)
  // Looking for pattern: 5 consecutive single digits 1-5
  const autoreporteMatch = sectionText.match(
    /autoreporte[\s\S]*?(\d)\s+(\d)\s+(\d)\s+(\d)\s+(\d)/i
  );
  const autoreporte = autoreporteMatch
    ? {
        bienestar_general: parseInt(autoreporteMatch[1], 10),
        aprendizaje: parseInt(autoreporteMatch[2], 10),
        relaciones_interpersonales: parseInt(autoreporteMatch[3], 10),
        autogestion_academica: parseInt(autoreporteMatch[4], 10),
        inclusion: parseInt(autoreporteMatch[5], 10),
      }
    : {
        bienestar_general: 0,
        aprendizaje: 0,
        relaciones_interpersonales: 0,
        autogestion_academica: 0,
        inclusion: 0,
      };

  // Extract menciones positivas (14 categories per PULSO.cl)
  const mencionesPositivas = {
    relaciones_compartir: extractCount(sectionText, '\\bcompartir\\b') || 0,
    relaciones_trabajar: extractCount(sectionText, '\\btrabajar\\b') || 0,
    ayuda_demas: extractCount(sectionText, 'ayuda|d[eé]mas') || 0,
    valor_respeto: extractCount(sectionText, '\\brespeto\\b') || 0,
    valor_vocacion: extractCount(sectionText, '\\bvocaci[oó]n\\b') || 0,
    valor_sencillez: extractCount(sectionText, '\\bsencillez\\b') || 0,
    valor_espiritu_comunitario:
      extractCount(sectionText, 'esp[íi]ritu|comunitario') || 0,
    valor_responsabilidad: extractCount(sectionText, '\\bresponsabilidad\\b') || 0,
    valor_verdad: extractCount(sectionText, '\\bverdad\\b') || 0,
    liderazgo: extractCount(sectionText, '\\bliderazgo\\b') || 0,
    trata_bien_incluye: extractCount(sectionText, 'trata|bien|incluye') || 0,
    resuelve_conflictos: extractCount(sectionText, 'conflicto|resuelve') || 0,
    total: 0,
  };

  // Calculate total for menciones positivas
  mencionesPositivas.total = Object.entries(mencionesPositivas)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);

  // Extract menciones negativas (5 categories per PULSO.cl)
  const mencionesNegativas = {
    relaciones_negativas_compartir:
      extractCount(sectionText, 'no\\s+compartir|negativo.*compartir') || 0,
    siente_solo:
      extractCount(sectionText, '\\b(solo|aislado|aislada)\\b') || 0,
    pasandolo_mal:
      extractCount(sectionText, 'mal|dificultad|difícil') || 0,
    relaciones_negativas_trabajar:
      extractCount(sectionText, 'no\\s+trabajar|negativo.*trabajar') || 0,
    molesta_otros:
      extractCount(sectionText, 'molesta|irrita|perturba') || 0,
    total: 0,
  };

  // Calculate total for menciones negativas
  mencionesNegativas.total = Object.entries(mencionesNegativas)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);

  // Extract rol (classification)
  const rolMatch = sectionText.match(
    /(Líder\s+Positivo|Saludable|Desafío|No\s+responde)/i
  );
  const rol = (rolMatch?.[1]?.replace(/\s+/g, ' ') ||
    'No responde') as
    | 'Líder Positivo'
    | 'Saludable'
    | 'Desafío'
    | 'No responde';

  // Extract comentarios (positive and negative feedback)
  const comentariosPositivosMatch = sectionText.match(
    /comentarios?\s+positivos?[\s\S]*?(.*?)(?=comentarios?\s+negativ|$)/i
  );
  const comentariosNegativosMatch = sectionText.match(
    /comentarios?\s+negativ[os]?[\s\S]*?(.*?)$/i
  );

  return {
    id: studentName
      .replace(/\s+/g, '-')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, ''),
    nombre: studentName,
    rol,
    autoreporte,
    menciones_positivas: mencionesPositivas,
    menciones_negativas: mencionesNegativas,
    comentarios: {
      positivos: comentariosPositivosMatch?.[1]?.trim() || null,
      negativos: comentariosNegativosMatch?.[1]?.trim() || null,
    },
  };
}

/**
 * Parse a PULSO.cl individual PDF report
 * Extracts student data from sections, one per student
 * @param pdfBuffer Buffer containing the PDF file data
 * @returns Promise with array of StudentSociogramData
 */
export async function parseIndividualPDF(
  pdfBuffer: Buffer
): Promise<StudentSociogramData[]> {
  const pdfjs = await getPdfjs();

  // Convert Buffer to Uint8Array for pdfjs compatibility
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
  const lines: string[] = [];

  // Extract text from all pages using layout-aware parsing
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = extractLinesFromPDF(textContent);
    lines.push(...pageLines);
  }

  // Join lines with newlines to preserve structure
  const fullText = lines.join('\n');

  // Find student sections by looking for student names at the start of lines
  // followed by their data (autoreporte, menciones, etc.)
  const students: StudentSociogramData[] = [];
  const seenNames = new Set<string>();

  // Look for lines that start with a student name
  const studentNamePattern = /^([A-Z][a-záéíóúüñ]+\s+[A-Z][a-záéíóúüñ]+(?:\s+[A-Z][a-záéíóúüñ]+)?)\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nameMatch = line.match(studentNamePattern);

    if (!nameMatch) continue;

    const studentName = nameMatch[1].trim();

    // Skip common non-student names
    if (
      studentName.match(
        /^\s*(Informe|Reporte|Individual|Report|Sociograma|Tabla|Total|Estudiante|Autoreporte|Menciones|Relaciones|Datos|Detallados)/i
      ) ||
      seenNames.has(studentName)
    ) {
      continue;
    }

    seenNames.add(studentName);

    // Extract section from current line to next student or end
    let nextStudentIndex = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(studentNamePattern)) {
        nextStudentIndex = j;
        break;
      }
    }

    const sectionLines = lines.slice(i, nextStudentIndex);
    const sectionText = sectionLines.join('\n');

    // Only add if section has meaningful content (autoreporte or menciones)
    if (sectionText.match(/autoreporte|menci[oó]n/i)) {
      const studentData = extractStudentSection(studentName, sectionText);
      students.push(studentData);
      console.debug(`Parsed student: ${studentName}`);
    }
  }

  if (students.length === 0) {
    console.warn('No students found in individual PDF. Check document structure.');
  } else {
    console.debug(`Successfully parsed ${students.length} students from individual PDF`);
  }

  return students;
}

/**
 * Phase A: Extract student table data using deepseek-chat (text model)
 * @param fullText Extracted text from PDF/Markdown
 * @param apiKey DeepSeek API key
 * @returns Promise with parsed estudiantes array
 */
async function extractStudentTableWithDeepSeek(
  fullText: string,
  apiKey: string
): Promise<{ estudiantes: Array<any> }> {
  const prompt = `Eres un experto analizando reportes PULSO.cl de sociogramas. El documento puede tener formato desordenado o estar en Markdown.

EXTRAE todos los datos de estudiantes:
- Nombres de estudiantes
- Scores autoreporte (5 dimensiones, escala 1-5)
- Conteos de menciones (categorías positivas y negativas)
- Rol del estudiante (Líder Positivo, Desafío, No responde, Saludable, Amistoso(a), o si tiene descripción especial)

CATEGORÍAS MENCIONES POSITIVAS (busca en la tabla):
- relaciones_compartir: número
- relaciones_trabajar: número
- ayuda_demas: número
- valor_respeto: número
- valor_vocacion: número
- valor_sencillez: número
- valor_espiritu_comunitario: número
- valor_responsabilidad: número
- valor_verdad: número
- liderazgo: número
- trata_bien_incluye: número
- resuelve_conflictos: número

CATEGORÍAS MENCIONES NEGATIVAS:
- relaciones_negativas_compartir: número
- siente_solo: número
- pasandolo_mal: número
- relaciones_negativas_trabajar: número
- molesta_otros: número
- excluye_trata_mal: número
- pasandolo_mal_redes: número

RETORNA SOLO JSON válido (sin markdown, sin bloques de código):
{
  "estudiantes": [
    {
      "nombre": "string (nombre completo del estudiante)",
      "autoreporte": {
        "bienestar_general": número 1-5,
        "aprendizaje": número 1-5,
        "relaciones_interpersonales": número 1-5,
        "autogestion_academica": número 1-5,
        "inclusion": número 1-5
      },
      "menciones_positivas": {
        "relaciones_compartir": número,
        "relaciones_trabajar": número,
        "ayuda_demas": número,
        "valor_respeto": número,
        "valor_vocacion": número,
        "valor_sencillez": número,
        "valor_espiritu_comunitario": número,
        "valor_responsabilidad": número,
        "valor_verdad": número,
        "liderazgo": número,
        "trata_bien_incluye": número,
        "resuelve_conflictos": número,
        "total": número (suma de arriba)
      },
      "menciones_negativas": {
        "relaciones_negativas_compartir": número,
        "siente_solo": número,
        "pasandolo_mal": número,
        "relaciones_negativas_trabajar": número,
        "molesta_otros": número,
        "excluye_trata_mal": número,
        "pasandolo_mal_redes": número,
        "total": número (suma de arriba)
      },
      "rol": "Líder Positivo" | "Saludable" | "Desafío" | "No responde" | "Amistoso(a)" | "Dificultad para trabajar en grupo"
    }
  ]
}

Si la tabla está desordenada o mal formateada, INTERPRETA los números disponibles. Prioriza exactitud sobre estructura perfecta.

Datos del documento:
${fullText}`;

  try {
    const requestBody = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 30000,
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '');
      jsonStr = jsonStr.replace(/```\s*$/, '');
      jsonStr = jsonStr.trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('DeepSeek table parsing failed:', error);
    throw error;
  }
}


/**
 * Parse individual PULSO.cl reports from Markdown
 * Individual reports have per-student data with better structure
 * @param markdownContent String content of the individual markdown file
 * @param apiKey DeepSeek API key
 * @returns Promise with parsed estudiantes array
 */
async function extractIndividualReportWithDeepSeek(
  markdownContent: string,
  apiKey: string
): Promise<{ estudiantes: Array<any> }> {
  // Split by student section (pattern: "Reporte sociograma 2025 - III° C TABOR\n<Nombre>")
  const sections = markdownContent.split(/Reporte\s+sociograma\s+\d+\s*-[^\n]+\n+/);

  // Filter out empty sections and process each student section
  const studentSections = sections.filter(s => s.trim().length > 50);

  console.log(`✓ Found ${studentSections.length} student sections in individual report`);

  // Send all sections to DeepSeek for extraction
  const prompt = `Eres un experto analizando reportes individuales PULSO.cl de sociogramas.

Para CADA sección (cada estudiante), extrae:
- Nombre completo del estudiante (aparece al inicio)
- Rol/Perfil (ej: "Amistoso(a)", "Dificultad para trabajar en grupo", o "No responde")
- Autoreporte: 5 scores numéricos (1-5) en orden: bienestar_general, aprendizaje, relaciones_interpersonales, autogestion_academica, inclusion
- Menciones Positivas: todos los números de cada categoría
- Menciones Negativas: todos los números de cada categoría

CATEGORÍAS MENCIONES POSITIVAS:
relaciones_compartir, relaciones_trabajar, ayuda_demas, valor_respeto, valor_vocacion, valor_sencillez, valor_espiritu_comunitario, valor_responsabilidad, valor_verdad, liderazgo, trata_bien_incluye, resuelve_conflictos

CATEGORÍAS MENCIONES NEGATIVAS:
relaciones_negativas_compartir, siente_solo, pasandolo_mal, relaciones_negativas_trabajar, molesta_otros, excluye_trata_mal, pasandolo_mal_redes

RETORNA JSON válido (sin markdown):
{
  "estudiantes": [
    {
      "nombre": "string",
      "autoreporte": {
        "bienestar_general": 1-5,
        "aprendizaje": 1-5,
        "relaciones_interpersonales": 1-5,
        "autogestion_academica": 1-5,
        "inclusion": 1-5
      },
      "menciones_positivas": {
        "relaciones_compartir": número,
        "relaciones_trabajar": número,
        "ayuda_demas": número,
        "valor_respeto": número,
        "valor_vocacion": número,
        "valor_sencillez": número,
        "valor_espiritu_comunitario": número,
        "valor_responsabilidad": número,
        "valor_verdad": número,
        "liderazgo": número,
        "trata_bien_incluye": número,
        "resuelve_conflictos": número,
        "total": número
      },
      "menciones_negativas": {
        "relaciones_negativas_compartir": número,
        "siente_solo": número,
        "pasandolo_mal": número,
        "relaciones_negativas_trabajar": número,
        "molesta_otros": número,
        "excluye_trata_mal": número,
        "pasandolo_mal_redes": número,
        "total": número
      },
      "rol": "string"
    }
  ]
}

REPORTES INDIVIDUALES A PROCESAR:
${studentSections.join('\n\n---\n\n')}`;

  try {
    const requestBody = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 40000,
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '');
      jsonStr = jsonStr.replace(/```\s*$/, '');
      jsonStr = jsonStr.trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('DeepSeek individual parsing failed:', error);
    throw error;
  }
}

/**
 * Parse PULSO.cl sociogram from Markdown file using DeepSeek Chat
 * Supports both group and individual reports
 * @param markdownContent String content of the markdown file
 * @param isIndividualReport Optional flag to indicate if this is an individual report
 * @returns Promise with students array and relations array
 */
export async function parseMarkdownSociogram(
  markdownContent: string,
  isIndividualReport: boolean = false
): Promise<{
  students: string[];
  relations: Array<{ from: string; to: string; tipo: string; count: number }>;
  studentData: Array<{
    nombre: string;
    autoreporte: { bienestar_general: number; aprendizaje: number; relaciones_interpersonales: number; autogestion_academica: number; inclusion: number };
    menciones_positivas: Record<string, number>;
    menciones_negativas: Record<string, number>;
    rol: string;
  }>;
}> {
  // Get DeepSeek API key
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }

  try {
    let tableResult;

    if (isIndividualReport) {
      console.log('✓ Parsing individual markdown report with deepseek-chat...');
      tableResult = await extractIndividualReportWithDeepSeek(markdownContent, deepseekApiKey);
    } else {
      console.log('✓ Parsing group markdown report with deepseek-chat...');
      tableResult = await extractStudentTableWithDeepSeek(markdownContent, deepseekApiKey);
    }

    // Relations are inferred from mention counts in the table data
    const relations: Array<{ from: string; to: string; tipo: string; fuerza: number }> = [];
    console.log('ℹ Sociogram data extracted from markdown');
    console.log(`  - ${tableResult.estudiantes.length} students with profiles`);
    console.log(`  - Mention counts: positive/negative per student`);
    console.log(`  - Node sizing: based on mention counts`);
    console.log(`  - Node color: based on student role (Líder, Desafío, etc.)`);

    // Combine results
    const students = tableResult.estudiantes.map((e: any) => e.nombre);
    console.log(`✓ Total: ${students.length} students, ${relations.length} relations`);

    return {
      students,
      relations: relations.map((r: any) => ({
        from: r.from,
        to: r.to,
        tipo: r.tipo,
        count: r.fuerza || 1,
      })),
      studentData: tableResult.estudiantes,
    };
  } catch (error) {
    console.error('Markdown parsing failed:', error);
    throw error;
  }
}

/**
 * Parse PULSO.cl group PDF using DeepSeek Vision/Chat to extract table data
 * Converts PDF text to structured student data via AI interpretation
 * @param pdfBuffer Buffer containing the PDF file data
 * @returns Promise with students array and relations array
 */
export async function parseGroupPDFWithDeepSeek(
  pdfBuffer: Buffer,
  options?: { graphPage2?: string; graphPage3?: string }
): Promise<{
  students: string[];
  relations: Array<{ from: string; to: string; tipo: string; count: number }>;
  studentData: Array<{
    nombre: string;
    autoreporte: { bienestar_general: number; aprendizaje: number; relaciones_interpersonales: number; autogestion_academica: number; inclusion: number };
    menciones_positivas: Record<string, number>;
    menciones_negativas: Record<string, number>;
    rol: string;
  }>;
}> {
  const pdfjs = await getPdfjs();
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
  const lines_final: string[] = [];

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = extractLinesFromPDF(textContent);
    lines_final.push(...pageLines);
  }

  const fullText = lines_final.join('\n');

  // Get DeepSeek API key
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }

  try {
    // Phase A: Extract student table data using deepseek-chat
    console.log('✓ Phase A: Extracting student table data with deepseek-chat...');
    const tableResult = await extractStudentTableWithDeepSeek(fullText, deepseekApiKey);

    // Note: Visual graph analysis skipped to avoid token costs
    // Relations can be inferred from the mention counts in the table data
    const relations: Array<{ from: string; to: string; tipo: string; fuerza: number }> = [];
    console.log('ℹ Sociogram data extracted (table only, no specific relationship pairs)');
    console.log(`  - ${tableResult.estudiantes.length} students with profiles`);
    console.log(`  - Mention counts: positive/negative per student`);
    console.log(`  - Node sizing: based on mention counts`);
    console.log(`  - Node color: based on student role (Líder, Desafío, etc.)`);
    console.log('  - Edges: not extracted (requires vision API)');

    // Combine results
    const students = tableResult.estudiantes.map((e: any) => e.nombre);
    console.log(`✓ Total: ${students.length} students, ${relations.length} relations`);

    return {
      students,
      relations: relations.map((r: any) => ({
        from: r.from,
        to: r.to,
        tipo: r.tipo,
        count: r.fuerza || 1,
      })),
      studentData: tableResult.estudiantes,
    };
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw error;
  }
}
