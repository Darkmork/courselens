import { Timestamp } from 'firebase/firestore';

export interface StudentDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface RiskAssessment {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  overallScore: number;
}

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

export type { FormResponse, FormType, PersonalityTrait, PersonalData, AcademicData, SocialData, PersonalTraitsData, EmotionalData, FamilyData, SpiritualData, FutureData, FormImportResult } from './FormResponse';

export enum RiskStatus {
  RED = 'Rojo',
  YELLOW = 'Amarillo',
  GREEN = 'Verde',
}

export enum RelationalRole {
  LEADER = 'Líder',
  ISOLATED = 'Aislado',
  HEALTHY = 'Saludable',
  IN_CONFLICT = 'En Conflicto',
}

export enum Category {
  ACADEMIC = 'Académica',
  BEHAVIORAL = 'Conductual',
  RELATIONAL = 'Relacional',
  EMOTIONAL = 'Emocional',
}

export enum ConflictStatus {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Progreso',
  RESOLVED = 'Resuelto',
}

export enum Severity {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
}

export enum AgreementStatus {
  PENDING = 'Pendiente',
  COMPLETED = 'Completado',
  NOT_HONORED = 'Incumplido',
  OVERDUE = 'Atrasado',
}

export interface Student {
  id: string;
  courseId: string;
  name: string;
  rut: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  guardian1Name?: string;
  guardian1Relation?: string;
  guardian1Email?: string;
  guardian1Phone?: string;
  guardian2Name?: string;
  guardian2Relation?: string;
  guardian2Email?: string;
  guardian2Phone?: string;
  photoUrl?: string;
  diagnosis?: string;
  familySituation?: string;
  externalSupport?: string;
  medicalAlerts?: string;
  disciplinaryMeasures?: string;
  relationalRole?: RelationalRole;
  cohortGroup?: string;
  academicPerformance?: 'Muy Alto' | 'Alto' | 'Promedio' | 'Bajo' | 'Muy Bajo';
  academicNotes?: string;
  behaviorNotes?: string;
  riskStatus: RiskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  teacherId: string;
  name: string;
  year: number;
  healthScores: {
    academic: number;
    relational: number;
    emotional: number;
    spiritual: number;
  };
  createdAt: string;
}

export interface Observation {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  text: string;
  category: Category;
}

export interface StudentSociogramData {
  id: string;
  nombre: string;
  rol: 'Líder Positivo' | 'Saludable' | 'Desafío' | 'No responde';
  autoreporte: {
    bienestar_general: number;
    aprendizaje: number;
    relaciones_interpersonales: number;
    autogestion_academica: number;
    inclusion: number;
  };
  menciones_positivas: {
    relaciones_compartir: number;
    relaciones_trabajar: number;
    ayuda_demas: number;
    valor_respeto: number;
    valor_vocacion: number;
    valor_sencillez: number;
    valor_espiritu_comunitario: number;
    valor_responsabilidad: number;
    valor_verdad: number;
    liderazgo: number;
    trata_bien_incluye: number;
    resuelve_conflictos: number;
    total: number;
  };
  menciones_negativas: {
    relaciones_negativas_compartir: number;
    siente_solo: number;
    pasandolo_mal: number;
    relaciones_negativas_trabajar: number;
    molesta_otros: number;
    total: number;
  };
  comentarios: {
    positivos: string | null;
    negativos: string | null;
  };
}

export interface SociogramRelation {
  id?: string;
  from_id: string;
  to_id: string;
  tipo: 'trabajo_positivo' | 'convivencia_positiva' | 'trabajo_negativo' | 'convivencia_negativa';
  fuerza: number;
}

export interface SociogramMetrics {
  cohesion: number;
  fragmentacion: number;
  liderazgo_promedio: number;
  aislamiento_promedio: number;
}

export interface SociogramData {
  year: number;
  courseId: string;
  estudiantes: StudentSociogramData[];
  relaciones: SociogramRelation[];
  metricas: SociogramMetrics;
}

export interface Conflict {
  id: string;
  courseId: string;
  date: string;
  description: string;
  severity: Severity;
  status: ConflictStatus;
  studentIds: string[];
}

export interface Agreement {
  id: string;
  studentId: string;
  courseId: string;
  text: string;
  dueDate: string;
  status: AgreementStatus;
}

export enum ProjectStatus {
  PLANNING = 'Planificación',
  IN_PROGRESS = 'En Progreso',
  COMPLETED = 'Completado',
}

export enum MilestoneType {
  ACTIVITY = 'Actividad',
  ACHIEVEMENT = 'Logro',
  CHALLENGE = 'Desafío',
  CELEBRATION = 'Celebración',
}

export interface Project {
  id: string;
  courseId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate?: string;
}

export interface Milestone {
  id: string;
  courseId: string;
  date: string;
  type: MilestoneType;
  title: string;
  narrative: string;
}

export interface OrientationSession {
  id: string;
  courseId: string;
  date: string;
  topic: string;
  observations: string;
}

