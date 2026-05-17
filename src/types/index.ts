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

