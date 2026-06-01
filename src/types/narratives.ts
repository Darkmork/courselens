import { Timestamp } from 'firebase/firestore';

/**
 * Narrative types for AI-generated student and course stories.
 * Stored in Firestore collections:
 * - students/{id}/narratives
 * - sociogram_analysis_{year}
 */

export interface StudentNarrative {
  id?: string;
  studentId: string;
  courseId: string;
  generatedAt: Timestamp;
  narrativeType: 'growth' | 'risk' | 'parent_meeting' | 'general';
  content: string;
  formResponses?: string[]; // References to form response IDs used
  period?: string; // e.g., 'inicio_III_medio', 'fin_I_semestre', 'inicio_IV_medio'
}

export interface CourseNarrative {
  id?: string;
  courseId: string;
  year: number;
  generatedAt: Timestamp;
  narrativeType: 'course_story' | 'milestone' | 'summary';
  title: string;
  content: string;
  keyInsights?: string[];
  studentHighlights?: string[]; // Student IDs highlighted in the narrative
  metadata?: {
    studentCount: number;
    formResponsesCount: number;
    momentsCovered?: string[];
    cohesionScore?: number;
    leadershipScore?: number;
    emotionalWellness?: number;
  };
}