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
