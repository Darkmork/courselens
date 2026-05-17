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
    // Node.js environment - try to import pdfjs-dist
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
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

  // Load the PDF from the buffer
  const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
  let fullText = '';

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
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

  // Split by lines for parsing
  const lines = fullText.split('\n');

  // Track line index to parse table structure
  let parsingTable = false;
  const tableRows: { studentName: string; counts: number[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect table start by finding header keywords
    if (
      line.match(/trabajo.*positivo|convivencia.*positiva/i) ||
      line.match(/trabajo.*negativo|convivencia.*negativa/i)
    ) {
      parsingTable = true;
      continue;
    }

    // Parse table rows (student name followed by counts)
    if (parsingTable) {
      // Match Spanish names (capitalized first and last name, optionally middle)
      const nameMatch = line.match(
        /^([A-Z][a-záéíóúüñ]+\s+[A-Z][a-záéíóúüñ]+(?:\s+[A-Z][a-záéíóúüñ]+)?)/
      );

      if (nameMatch) {
        const studentName = nameMatch[1].trim();

        // Ensure uniqueness
        if (!students.includes(studentName)) {
          students.push(studentName);
        }

        // Extract numbers following the student name (relation counts)
        const numberMatches = line.match(/\d+/g);
        if (numberMatches && numberMatches.length >= 4) {
          const counts = numberMatches.slice(0, 4).map(Number);

          tableRows.push({
            studentName,
            counts,
          });
        }
      }

      // Stop parsing table when we hit non-table content
      if (
        line.match(/^\w+\s*:/) &&
        !line.match(/^([A-Z][a-záéíóúüñ]+\s+[A-Z][a-záéíóúüñ]+)/)
      ) {
        parsingTable = false;
      }
    }
  }

  // Build relations from table rows
  // Assumption: each row represents "from" student, columns represent "to" students
  for (let fromIdx = 0; fromIdx < tableRows.length; fromIdx++) {
    const fromRow = tableRows[fromIdx];

    // For each relation type column
    for (let typeIdx = 0; typeIdx < relationTypes.length; typeIdx++) {
      const count = fromRow.counts[typeIdx] || 0;

      if (count > 0) {
        // If there are multiple students, relate to others
        // Otherwise, create self-relations for data completeness
        if (students.length > 1 && fromIdx < students.length - 1) {
          relations.push({
            from: fromRow.studentName,
            to: students[(fromIdx + 1) % students.length],
            tipo: relationTypes[typeIdx],
            count,
          });
        }
      }
    }
  }

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

  const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
  let fullText = '';

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  // Find all student names (capitalized Spanish names)
  const studentPattern =
    /([A-Z][a-záéíóúüñ]+\s+[A-Z][a-záéíóúüñ]+(?:\s+[A-Z][a-záéíóúüñ]+)?)/g;
  const matches = Array.from(fullText.matchAll(studentPattern));

  const students: StudentSociogramData[] = [];

  for (let i = 0; i < matches.length; i++) {
    const studentName = matches[i][1].trim();

    // Skip common non-student names (e.g., headers, sections)
    if (
      studentName.match(
        /^\s*(Informe|Reporte|Sociograma|Tabla|Total|Estudiante)/i
      )
    ) {
      continue;
    }

    // Extract section from current match to next match (or end of text)
    const startIndex = matches[i].index + matches[i][0].length;
    const endIndex =
      i < matches.length - 1 ? matches[i + 1].index : fullText.length;
    const sectionText = fullText.substring(startIndex, endIndex);

    // Parse the student section
    const studentData = extractStudentSection(studentName, sectionText);
    students.push(studentData);
  }

  return students;
}
