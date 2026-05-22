// src/lib/csvParser.ts
import Papa from 'papaparse';
import { FormResponse, FormType } from '../types/FormResponse';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedCSVData {
  rows: Array<Record<string, string>>;
  headers: string[];
}

export interface ValidatedFormResponse {
  data: FormResponse;
  error?: string;
}

/**
 * Parse CSV file and return raw data with headers
 */
export function parseCSV(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results: any) => {
        const headers = results.data[0] || [];
        const rows = results.data.slice(1).filter((row: any[]) => row.some(cell => cell && cell.trim()));
        resolve({ headers, rows });
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Validate a single row and convert to FormResponse
 */
export function validateAndMapRow(
  row: Record<string, string>,
  formType: FormType,
  rowIndex: number
): ValidatedFormResponse {
  const email = row['Correo electronico'] || row['Correo electrónico'] || row['email'];
  const rut = row['RUT'] || row['rut'] || '';

  if (!email || !email.trim()) {
    return {
      data: {} as FormResponse,
      error: `Row ${rowIndex}: Email is required`,
    };
  }

  const responses = mapCSVRowToResponses(row, formType);

  const formResponse: FormResponse = {
    id: uuidv4(),
    formType,
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear(),
    email: email.trim(),
    rut: rut.trim(),
    responses,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { data: formResponse };
}

/**
 * Map CSV row fields to FormResponse.responses structure based on formType
 */
function mapCSVRowToResponses(row: Record<string, string>, formType: FormType): FormResponse['responses'] {
  const responses: FormResponse['responses'] = {};

  if (formType === 'inicio_III_medio') {
    responses.personal = {
      edad: row['Edad'] ? parseInt(row['Edad']) : undefined,
      familiares: row['¿Con quien vives?'],
      hermanos: row['¿Cuántos Hermanos tienes?'] ? parseInt(row['¿Cuántos Hermanos tienes?']) : undefined,
      posicion_familiar: row['¿Eres el/la mayor, el/la menor o del medio?'] as any,
      padres_ocupacion: row['¿A qué se dedican tus padres o tutores?'],
    };

    responses.family = {
      relacion_familia: row['¿Cómo describirías la relación con tu familia?'],
      admira_familiar: row['¿Tienes algún familiar que admires o consideres un ejemplo?'],
      cambios_deseados: row['¿Hay algo que te gustaría cambiar en la dinámica familiar?'],
    };

    responses.personal_traits = {
      habilidades: row['¿Cuáles crees que son tus mayores habilidades?']?.split(',').map(h => h.trim()),
      intereses: extractSíNoResponses(row, 'preguntas de respuesta sí o no'),
      deporte_arte: row['¿Practicas algún deporte o actividad artística?¿cúal?'],
      como_amigos_definen: row['- ¿Cómo crees que te definirían tus amigos?'],
      como_se_define: row['- ¿Y tú, cómo te defines?'],
    };

    responses.academic = {
      desempeño: row['¿Cómo te fue en el rendimiento académico el año pasado?'],
      asignaturas_fuertes: row['¿Hay alguna asignatura en la que tengas fortalezas y motivaciones?']?.split(',').map(s => s.trim()),
      asignaturas_debiles: row['¿Hay alguna asignatura en la que te presenten dificultades?']?.split(',').map(s => s.trim()),
    };

    responses.spiritual = {
      importancia_fe: row['¿Consideras importante la espiritualidad en tu vida?'],
      iglesia: row['¿Vas a la iglesia o participas en actividades religiosas?']?.toLowerCase() === 'sí',
      reza: row['¿Rezas?']?.toLowerCase() === 'sí',
      influencia_fe: row['¿Cómo influye tu fe en tu forma de relacionarte con los demás?'],
    };

    responses.future = {
      carrera_opcion: row['¿Hay alguna carrera o área de estudio que te llame la atención?'],
      planes: row['¿Tienes algún plan a corto o mediano plazo para trabajar?'],
      consejo_a_ti_mismo: row['¿Qué te gustaría mejorar de ti mismo/a este año?'],
    };
  } else if (formType === 'mediados_III_medio') {
    responses.academic = {
      desempeño: row['¿Cómo ves tu desempeño académico hasta ahora?'],
      asignaturas_fuertes: row['¿Qué asignaturas te interesan más?']?.split(',').map(s => s.trim()),
      asignaturas_debiles: row['¿En cuáles tienes dificultades?']?.split(',').map(s => s.trim()),
      estrategias_estudio: row['¿Qué estrategias te han funcionado para aprender mejor?'],
    };

    responses.social = {
      relacion_compañeros: row['¿Cómo te has sentido en tu grupo de compañeros?'],
      mejores_amigos: row['¿Quiénes son tus mejores amigos en el curso?']?.split(',').map(a => a.trim()),
      participacion_actividades: row['¿Participaste en alguna actividad del colegio?']?.split(',').map(a => a.trim()),
      conflictos: row['¿Has tenido algún conflicto que hayas resuelto?'],
    };

    responses.emotional = {
      bienestar: row['¿Cómo te has sentido emocionalmente?'],
      estres: row['¿Qué situaciones te han estresado?'],
      autoestima: row['¿Cómo te sientes respecto a ti mismo?'] ? (row['¿Cómo te sientes respecto a ti mismo?'].includes('bien') ? 8 : row['¿Cómo te sientes respecto a ti mismo?'].includes('mal') ? 4 : 6) : undefined,
      confianza: row['¿Tienes confianza en ti mismo?'] ? (row['¿Tienes confianza en ti mismo?'].includes('sí') ? 8 : 4) : undefined,
    };

    responses.personal_traits = {
      intereses: row['¿Descubriste nuevos intereses?']?.split(',').map(i => i.trim()),
      como_se_define: row['¿Cómo te ves ahora comparado con el inicio del año?'],
    };

    responses.future = {
      carrera_opcion: row['¿Sigues pensando en la misma carrera?'],
      planes: row['¿Tienes claro tu plan a futuro?'],
    };
  } else if (formType === 'fin_I_semestre') {
    responses.academic = {
      desempeño: row['¿Cómo evalúas tu desempeño académico este semestre?'],
      asignaturas_fuertes: row['¿En qué asignaturas te sentiste más cómodo/a y por qué?']?.split(',').map(s => s.trim()),
      estrategias_estudio: row['¿Qué estrategias de estudio te funcionaron mejor?'],
    };

    responses.social = {
      relacion_compañeros: row['¿Cómo describirías tu relación con tus compañeros de curso?'],
      participacion_actividades: row['¿Participaste en actividades de curso, comités, talleres u otras?']?.split(',').map(a => a.trim()),
      pertenencia_grupo: row['¿Sientes que formas parte de un grupo o comunidad dentro del colegio?']?.toLowerCase() === 'sí',
      conflictos: row['¿Has tenido algún conflicto este semestre?'],
    };

    responses.emotional = {
      bienestar: row['¿Cómo te sentiste emocionalmente durante este semestre?'],
      estres: row['¿Qué situaciones te generaron más estrés o preocupación?'],
      orgullo: row['¿Qué cosas te hicieron sentir orgulloso/a de ti mismo?'],
      equilibrio: row['¿Lograste un equilibrio entre el estudio, tus intereses personales y el descanso?']?.toLowerCase() === 'sí',
    };
  } else if (formType === 'inicio_IV_medio') {
    responses.academic = {
      nem_promedio: row['¿Cuál es tu promedio general acumulado (NEM) hasta la fecha?'] ? parseFloat(row['¿Cuál es tu promedio general acumulado (NEM) hasta la fecha?']) : undefined,
      paes_preparacion: row['¿Cómo calificarías tu nivel de preparación para la PAES?'] ? parseInt(row['¿Cómo calificarías tu nivel de preparación para la PAES?']) : undefined,
      carrera_opcion: row['¿Cuál es tu primera opción para el próximo año?'],
      universidad: row['¿En qué universidad te proyectas estudiando principalmente?'],
    };

    responses.future = {
      carrera_opcion: row['¿Cuál es tu primera opción para el próximo año?'],
      universidad: row['¿En qué universidad te proyectas estudiando principalmente?'],
      miedos: row['¿Cuál es tu principal temor respecto a la vida universitaria o adulta?'],
      presion_familiar: row['¿Te sientes presionado/a por tu entorno familiar respecto a la elección de tu carrera?']?.toLowerCase() === 'sí',
      vida_10_años: row['¿Dónde te imaginas viviendo en 10 años?'],
    };

    responses.spiritual = {
      importancia_fe: row['¿Cómo describirías tu relación actual con la fe y la Iglesia?'],
      compromiso_social: row['¿Cuál es tu principal temor respecto a la vida universitaria o adulta?'],
    };
  }

  return responses;
}

/**
 * Extract yes/no responses and return as string array
 */
function extractSíNoResponses(row: Record<string, string>, prefix: string): string[] {
  const responses: string[] = [];
  Object.entries(row).forEach(([key, value]) => {
    if (key.includes(prefix) && (value?.toLowerCase() === 'sí' || value?.toLowerCase() === 'yes')) {
      responses.push(key);
    }
  });
  return responses;
}
