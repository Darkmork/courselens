import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen, BarChart3, Award, AlertCircle, Zap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface StudentData {
  id: string;
  name: string;
  riskStatus?: string;
  cohortGroup?: string;
}

interface CourseStats {
  totalStudents: number;
  formResponsesCount: number;
  momentsCaptured: string[];
  cohesionScore?: number;
  leadershipScore?: number;
  emotionalWellness?: number;
}

interface CourseNarrativeProps {
  courseId: string;
  courseName: string;
  students: StudentData[];
  stats?: CourseStats;
  allFormResponses?: any[];
  onExportBook?: () => void;
}

export const CourseNarrative: React.FC<CourseNarrativeProps> = ({
  courseId,
  courseName,
  students,
  stats = {
    totalStudents: 0,
    formResponsesCount: 0,
    momentsCapured: [],
  },
  allFormResponses = [],
  onExportBook,
}) => {
  const [highlightedStudents, setHighlightedStudents] = useState<StudentData[]>([]);
  const [aiNarrative, setAiNarrative] = useState<string>('');
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  useEffect(() => {
    // Get top 3 students (by various metrics)
    setHighlightedStudents(students.slice(0, 3));
  }, [students]);

  const generateNarrative = async () => {
    setGeneratingNarrative(true);
    try {
      const response = await fetch('/api/ai/course-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseName,
          studentCount: stats.totalStudents,
          allFormResponses,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-neutral-400';
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMomentProgress = () => {
    const moments = {
      inicio_III_medio: '📋 Inicio',
      mediados_III_medio: '⚡ Mediados',
      inicio_IV_medio: '🎯 Final',
    };
    return stats.momentsCaptured
      .map(m => moments[m as keyof typeof moments])
      .join(' → ');
  };

  return (
    <div className="space-y-8">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border border-blue-200 rounded-2xl p-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{courseName}</h1>
            <p className="text-lg text-gray-600 mb-6">
              Historia colectiva de transformación académica, emocional y vocacional
            </p>

            {/* Progress Timeline */}
            {stats.momentsCaptured.length > 0 && (
              <div className="inline-block bg-white/70 border border-gray-200 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-700 font-mono">
                  {getMomentProgress()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {allFormResponses.length > 0 && !aiNarrative && (
              <button
                onClick={generateNarrative}
                disabled={generatingNarrative}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-neutral-600 disabled:to-neutral-600 text-white font-bold rounded-lg transition-all shadow-lg flex items-center gap-2"
              >
                {generatingNarrative ? (
                  <LoadingSpinner size="sm" label="Generando..." />
                ) : (
                  '✨ Generar Narrativa IA'
                )}
              </button>
            )}
            {onExportBook && (
              <button
                onClick={onExportBook}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg"
              >
                📖 Generar Libro Digital
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: 'Estudiantes',
            value: stats.totalStudents,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            icon: BookOpen,
            label: 'Respuestas Registradas',
            value: stats.formResponsesCount,
            color: 'from-purple-500 to-pink-500',
          },
          {
            icon: Zap,
            label: 'Cohesión del Grupo',
            value: stats.cohesionScore ? `${stats.cohesionScore}/10` : 'N/A',
            color: 'from-yellow-500 to-orange-500',
          },
          {
            icon: Award,
            label: 'Bienestar Emocional',
            value: stats.emotionalWellness ? `${stats.emotionalWellness}/10` : 'N/A',
            color: 'from-green-500 to-emerald-500',
          },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${metric.color} p-0.5 rounded-xl`}
            >
              <div className="bg-white rounded-lg p-6 h-full shadow-sm">
                <Icon className="w-6 h-6 text-gray-600 mb-3" />
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Narrative */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          Narrativa del Curso
        </h2>

        {aiNarrative ? (
          <div className="bg-gradient-to-b from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiNarrative}</p>
          </div>
        ) : (
          <div className="prose prose-gray max-w-none">
            <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-base">
              <span className="font-bold text-gray-900">"{courseName}"</span> es un viaje colectivo de {stats.totalStudents} estudiantes de tercero medio que marcó un quiebre en su comprensión de sí mismos, sus relaciones y sus futuros posibles.
            </p>

            <p className="text-base">
              En <span className="text-blue-600 font-bold">marzo</span>, cuando comenzó el año, el curso era un mosaico de expectativas, inseguridades y sueños apenas articulados. A través de formularios iniciales, capturamos quiénes creían ser: sus fortalezas académicas, sus miedos silenciosos, los primeros destellos de vocaciones emergentes, y sus relaciones —tanto las sólidas como las frágiles.
            </p>

            <p className="text-base">
              Siete semanas después, en <span className="text-yellow-600 font-bold">junio</span>, regresamos para encontrar un grupo en movimiento. Algunos descubrieron nuevas pasiones. Otros enfrentaron desafíos académicos inesperados. Las dinámicas sociales evolucionaron: nuevas amistades se forjaron, algunas tensiones se resolvieron, y la cohesión del grupo comenzó a tomar forma real.
            </p>

            <p className="text-base">
              Finalmente, en <span className="text-green-600 font-bold">septiembre</span>, al ingresar a cuarto medio, el curso había sido transformado. Ya no eran preguntas sin respuesta, sino estudiantes con decisiones vocacionales claras, una mayor claridad sobre sus fortalezas, una red relacional más sólida, y una comprensión más profunda de quiénes querían ser.
            </p>

            <p className="text-base italic text-gray-500 mt-6 pt-4 border-t border-gray-200">
              Esta no es solo una base de datos educativa. Es un <span className="text-gray-900 font-bold">registro vivo</span> de cómo los jóvenes crecen, se transforman, y encuentran su lugar en el mundo.
            </p>
            </div>
          </div>
        )}
      </div>

      {/* Student Highlights */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Award className="w-6 h-6 text-purple-500" />
          Historias Destacadas
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {highlightedStudents.map((student, idx) => (
            <div
              key={student.id}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{student.name}</h3>
                {idx === 0 && <span className="text-2xl">🌟</span>}
                {idx === 1 && <span className="text-2xl">⚡</span>}
                {idx === 2 && <span className="text-2xl">🚀</span>}
              </div>
              <p className="text-sm text-gray-500">
                {student.cohortGroup ? `Grupo: ${student.cohortGroup}` : 'Estudiante del curso'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        {(() => {
          // Generate insights dynamically from student data
          const redCount = students.filter((s: any) => s.riskStatus === 'Rojo').length;
          const yellowCount = students.filter((s: any) => s.riskStatus === 'Amarillo').length;
          const greenCount = students.filter((s: any) => s.riskStatus === 'Verde').length;

          const strengths = [
            greenCount > 0 && `✓ ${greenCount} estudiantes sin riesgo académico/emocional`,
            students.length > 0 && `✓ ${Math.round((greenCount / students.length) * 100)}% del grupo en buen estado`,
            allFormResponses.length > 0 && `✓ ${allFormResponses.length} respuestas de formularios registradas`,
          ].filter(Boolean);

          const areas = [
            redCount > 0 && `⚠ ${redCount} estudiante(s) requiere(n) atención prioritaria`,
            yellowCount > 0 && `⚠ ${yellowCount} estudiante(s) en seguimiento (riesgo medio)`,
            students.length > 0 && yellowCount + redCount > 0 && `⚠ Trabajar dinámicas de apoyo peer-to-peer`,
          ].filter(Boolean);

          return [
            {
              title: 'Fortalezas Colectivas',
              items: strengths.length > 0 ? (strengths as string[]) : ['✓ Datos pendientes de análisis'],
              icon: TrendingUp,
              color: 'from-green-500/20 to-emerald-500/20',
              border: 'border-green-500/30',
            },
            {
              title: 'Áreas de Crecimiento',
              items: areas.length > 0 ? (areas as string[]) : ['⚠ Sin áreas críticas identificadas'],
              icon: AlertCircle,
              color: 'from-yellow-500/20 to-orange-500/20',
              border: 'border-yellow-500/30',
            },
          ];
        })().map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${section.color} border ${section.border} rounded-lg p-6`}
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Transforma datos en historias significativas
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Cada respuesta de formulario es un capítulo. Cada estudiante es un protagonista. Juntos, crean la historia única de tu curso.
        </p>
        {onExportBook && (
          <button
            onClick={onExportBook}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all inline-flex items-center gap-2"
          >
            <span>📖</span>
            Crear Libro Digital Completo
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseNarrative;
