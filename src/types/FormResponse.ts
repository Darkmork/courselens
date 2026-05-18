/**
 * FormResponse types for Google Forms integration.
 *
 * Uses snake_case naming to mirror CSV column names from Google Forms exports
 * and maintain consistency with PULSO.cl integration (see pulsoParser.ts, sociogramMetrics.ts).
 * This diverges from the Student interface's camelCase but ensures domain consistency
 * for form/PULSO data models.
 *
 * @see docs/superpowers/specs/2026-05-17-google-forms-timeline-design.md
 */

export type FormType = 'inicio_III_medio' | 'fin_I_semestre' | 'inicio_IV_medio';

/**
 * Personality traits from "inicio_III_medio" Google Form yes/no questions.
 * Each trait corresponds to a yes/no checkbox in the form like:
 * - lee: "¿Te gusta leer?"
 * - organizado: "¿Eres una persona organizada?"
 * - introvertido: "¿Prefieres pasar tiempo solo?"
 * - deporte: "¿Te gusta el deporte?"
 * - creativo: "¿Te consideras una persona creativa?"
 * - musica: "¿Te gusta la música?"
 * - puntual: "¿Eres una persona puntual?"
 * - publico: "¿Te sientes cómodo hablando en público?"
 * - cocina: "¿Te gusta cocinar?"
 * - idioma: "¿Te interesa aprender otro idioma?"
 * - viajes: "¿Te gustaría viajar a otro país?"
 * - peliculas: "¿Te gusta ver películas o series?"
 * - riesgos: "¿Eres una persona que prefiere tomar riesgos?"
 * - voluntariado: "¿Te gustaría participar en algún voluntariado o trabajo social?"
 * - autodidacta: "¿Te consideras una persona autodidacta?"
 *
 * @see Form: https://docs.google.com/forms/d/e/1FAIpQLSfFRRSzin1jrjpWGxPRgRfAP_uEa_JjcqRpq4gcyh0JXuQf-Q
 */
export type PersonalityTrait = 'lee' | 'organizado' | 'introvertido' | 'deporte' | 'creativo' | 'musica' | 'puntual' | 'publico' | 'cocina' | 'idioma' | 'viajes' | 'peliculas' | 'riesgos' | 'voluntariado' | 'autodidacta';

export interface PersonalData {
  edad?: number;
  familiares?: string;
  hermanos?: number;
  posicion_familiar?: 'Mayor' | 'Menor' | 'Medio';
  padres_ocupacion?: string;
}

export interface AcademicData {
  desempeño?: string;
  asignaturas_fuertes?: string[];
  asignaturas_debiles?: string[];
  estrategias_estudio?: string;
  nem_promedio?: number;
  paes_preparacion?: number;
  carrera_opcion?: string;
  universidad?: string;
}

export interface SocialData {
  relacion_compañeros?: string;
  mejores_amigos?: string[];
  participacion_actividades?: string[];
  conflictos?: string;
  pertenencia_grupo?: boolean;
}

export interface PersonalTraitsData {
  habilidades?: string[];
  intereses?: string[];
  deporte_arte?: string;
  personalidad_respuestas?: Record<PersonalityTrait, boolean>;
  como_amigos_definen?: string;
  como_se_define?: string;
}

export interface EmotionalData {
  bienestar?: string;
  estres?: string;
  confianza?: number;
  autoestima?: number;
  orgullo?: string;
  equilibrio?: boolean;
}

export interface FamilyData {
  relacion_familia?: string;
  admira_familiar?: string;
  cambios_deseados?: string;
  apoyo_recibido?: string;
}

export interface SpiritualData {
  importancia_fe?: string;
  iglesia?: boolean;
  reza?: boolean;
  influencia_fe?: string;
  identidad_colegio?: string;
  compromiso_social?: string;
}

export interface FutureData {
  carrera_opcion?: string;
  universidad?: string;
  planes?: string;
  miedos?: string;
  presion_familiar?: boolean;
  vida_10_años?: string;
  consejo_a_ti_mismo?: string;
}

export interface FormResponse {
  id: string;
  formType: FormType;
  timestamp: string; // ISO 8601
  year: number;
  email: string;
  rut: string;
  responses: {
    personal?: PersonalData;
    academic?: AcademicData;
    social?: SocialData;
    personal_traits?: PersonalTraitsData;
    emotional?: EmotionalData;
    family?: FamilyData;
    spiritual?: SpiritualData;
    future?: FutureData;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FormImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; email?: string; reason: string }>;
}
