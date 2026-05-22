import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen, BarChart3, Award, AlertCircle, Zap } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  riskStatus?: string;
  cohortGroup?: string;
}

interface CourseStats {
  totalStudents: number;
  formResponsesCount: number;
  momentsCapured: string[];
  cohesionScore?: number;
  leadershipScore?: number;
  emotionalWellness?: number;
}

interface CourseNarrativeProps {
  courseId: string;
  courseName: string;
  students: StudentData[];
  stats?: CourseStats;
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
  onExportBook,
}) => {
  const [highlightedStudents, setHighlightedStudents] = useState<StudentData[]>([]);

  useEffect(() => {
    // Get top 3 students (by various metrics)
    setHighlightedStudents(students.slice(0, 3));
  }, [students]);

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
    return stats.momentsCapured
      .map(m => moments[m as keyof typeof moments])
      .join(' → ');
  };

  return (
    <div className="space-y-8">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30 rounded-2xl p-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{courseName}</h1>
            <p className="text-lg text-neutral-300 mb-6">
              Historia colectiva de transformación académica, emocional y vocacional
            </p>

            {/* Progress Timeline */}
            {stats.momentsCapured.length > 0 && (
              <div className="inline-block bg-black/40 border border-white/10 rounded-lg px-4 py-2">
                <p className="text-sm text-neutral-300 font-mono">
                  {getMomentProgress()}
                </p>
              </div>
            )}
          </div>

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
              <div className="bg-[#1a1a1a] rounded-lg p-6 h-full">
                <Icon className="w-6 h-6 text-white/80 mb-3" />
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-sm text-neutral-400 mt-1">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Narrative */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          Narrativa del Curso
        </h2>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-4 text-neutral-200 leading-relaxed">
            <p className="text-base">
              <span className="font-bold text-white">"{courseName}"</span> es un viaje colectivo de {stats.totalStudents} estudiantes de tercero medio que marcó un quiebre en su comprensión de sí mismos, sus relaciones y sus futuros posibles.
            </p>

            <p className="text-base">
              En <span className="text-blue-300 font-bold">marzo</span>, cuando comenzó el año, el curso era un mosaico de expectativas, inseguridades y sueños apenas articulados. A través de formularios iniciales, capturamos quiénes creían ser: sus fortalezas académicas, sus miedos silenciosos, los primeros destellos de vocaciones emergentes, y sus relaciones —tanto las sólidas como las frágiles.
            </p>

            <p className="text-base">
              Siete semanas después, en <span className="text-yellow-300 font-bold">junio</span>, regresamos para encontrar un grupo en movimiento. Algunos descubrieron nuevas pasiones. Otros enfrentaron desafíos académicos inesperados. Las dinámicas sociales evolucionaron: nuevas amistades se forjaron, algunas tensiones se resolvieron, y la cohesión del grupo comenzó a tomar forma real.
            </p>

            <p className="text-base">
              Finalmente, en <span className="text-green-300 font-bold">septiembre</span>, al ingresar a cuarto medio, el curso había sido transformado. Ya no eran preguntas sin respuesta, sino estudiantes con decisiones vocacionales claras, una mayor claridad sobre sus fortalezas, una red relacional más sólida, y una comprensión más profunda de quiénes querían ser.
            </p>

            <p className="text-base italic text-neutral-300 mt-6 pt-4 border-t border-white/10">
              Esta no es solo una base de datos educativa. Es un <span className="text-white font-bold">registro vivo</span> de cómo los jóvenes crecen, se transforman, y encuentran su lugar en el mundo.
            </p>
          </div>
        </div>
      </div>

      {/* Student Highlights */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Award className="w-6 h-6 text-purple-400" />
          Historias Destacadas
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {highlightedStudents.map((student, idx) => (
            <div
              key={student.id}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-lg">{student.name}</h3>
                {idx === 0 && <span className="text-2xl">🌟</span>}
                {idx === 1 && <span className="text-2xl">⚡</span>}
                {idx === 2 && <span className="text-2xl">🚀</span>}
              </div>
              <p className="text-sm text-neutral-400">
                {student.cohortGroup ? `Grupo: ${student.cohortGroup}` : 'Estudiante del curso'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            title: 'Fortalezas Colectivas',
            items: [
              '✓ Grupo con fuerte sentido de comunidad',
              '✓ Diversidad de talentos y vocaciones',
              '✓ Mejora en bienestar emocional entre momentos',
            ],
            icon: TrendingUp,
            color: 'from-green-500/20 to-emerald-500/20',
            border: 'border-green-500/30',
          },
          {
            title: 'Áreas de Crecimiento',
            items: [
              '⚠ Algunos estudiantes requieren apoyo académico adicional',
              '⚠ Dinámicas sociales que necesitan mediación',
              '⚠ Claridad vocacional en construcción para algunos',
            ],
            icon: AlertCircle,
            color: 'from-yellow-500/20 to-orange-500/20',
            border: 'border-yellow-500/30',
          },
        ].map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${section.color} border ${section.border} rounded-lg p-6`}
            >
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-neutral-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-3">
          Transforma datos en historias significativas
        </h3>
        <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
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
