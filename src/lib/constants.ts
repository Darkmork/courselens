export const DEFAULT_COURSE_ID = 'course-1';
export const DEFAULT_STUDENT_ID = 'student-1';
export const DEFAULT_YEARS: number[] = [2024, 2025, 2026, 2027];

/**
 * Moment labels for form types (used in timeline displays)
 */
export const MOMENT_LABELS: Record<string, string> = {
  inicio_III_medio: 'Inicio III',
  mediados_III_medio: 'Mediados III',
  fin_I_semestre: 'Fin I Semestre',
  inicio_IV_medio: 'Inicio IV',
};

/**
 * Moment dates for form types - should be configured via props or env
 * These are placeholder defaults that should be overridden
 */
export const MOMENT_DATES: Record<string, string> = {
  inicio_III_medio: 'Marzo 2024',
  mediados_III_medio: 'Junio 2024',
  fin_I_semestre: 'Diciembre 2024',
  inicio_IV_medio: 'Septiembre 2024',
};