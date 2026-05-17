import type { SociogramMetrics, StudentSociogramData, SociogramRelation } from '../types/index';

/**
 * Calculate sociogram metrics from student and relation data
 * Metrics include cohesion, fragmentation, average leadership, and average isolation
 */
export function calculateMetrics(data: {
  estudiantes: StudentSociogramData[];
  relaciones: SociogramRelation[];
}): SociogramMetrics {
  const { estudiantes, relaciones } = data;

  // Cohesion: actual connections / possible connections * 10
  const conexionesReales = relaciones.length;
  const conexionesPosibles = estudiantes.length * (estudiantes.length - 1);
  const cohesion = conexionesPosibles > 0
    ? (conexionesReales / conexionesPosibles) * 10
    : 0;

  // Fragmentation: % of students with 0 connections
  const conectados = new Set(relaciones.flatMap(r => [r.from_id, r.to_id]));
  const aislados = estudiantes.length - conectados.size;
  const fragmentacion = estudiantes.length > 0
    ? (aislados / estudiantes.length) * 100
    : 0;

  // Average leadership: avg positive mentions per student
  const liderazgoPromedio = estudiantes.length > 0
    ? estudiantes.reduce((sum, e) => sum + e.menciones_positivas.total, 0) / estudiantes.length
    : 0;

  // Isolation: % of students with 0 positive mentions
  const sinMenciones = estudiantes.filter(e => e.menciones_positivas.total === 0).length;
  const aislamientoPromedio = estudiantes.length > 0
    ? (sinMenciones / estudiantes.length) * 100
    : 0;

  return {
    cohesion,
    fragmentacion,
    liderazgo_promedio: liderazgoPromedio,
    aislamiento_promedio: aislamientoPromedio,
  };
}
