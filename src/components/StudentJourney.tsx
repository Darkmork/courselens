import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, Brain, Zap, BookOpen, Users, Lightbulb, Calendar } from 'lucide-react';
import type { FormResponse } from '../types/FormResponse';
import { MOMENT_LABELS, MOMENT_DATES } from '../lib/constants';
import LoadingSpinner from './LoadingSpinner';

interface StudentJourneyProps {
  studentId: string;
  studentName: string;
  formResponses: FormResponse[];
  onExport?: () => void;
}

interface Insight {
  category: string;
  change: number;
  label: string;
  icon: React.ReactNode;
}

// Safe field accessor with validation and fallback
const getFieldValue = <T,>(obj: T | undefined | null, fallback: T): T => {
  return obj ?? fallback;
};

export const StudentJourney: React.FC<StudentJourneyProps> = ({
  studentId,
  studentName,
  formResponses,
  onExport,
}) => {
  const [sortedResponses, setSortedResponses] = useState<FormResponse[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [narrative, setNarrative] = useState<string>('');
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  useEffect(() => {
    // Sort by form type order
    const order = { inicio_III_medio: 0, mediados_III_medio: 1, fin_I_semestre: 2, inicio_IV_medio: 3 };
    const sorted = [...formResponses].sort((a, b) =>
      (order[a.formType as keyof typeof order] ?? 999) - (order[b.formType as keyof typeof order] ?? 999)
    );
    setSortedResponses(sorted);

    // Calculate insights
    if (sorted.length >= 2) {
      const insights_list: Insight[] = [];

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (first.responses.emotional && last.responses.emotional) {
        const stressValue = getFieldValue(last.responses.emotional.estres, '');
        const stressChange = stressValue ? -1 : 1;
        insights_list.push({
          category: 'Bienestar',
          change: stressChange,
          label: stressChange > 0 ? '↑ Menos estrés' : '↓ Mayor estrés',
          icon: <Heart className="w-4 h-4" />,
        });
      }

      if (first.responses.future && last.responses.future) {
        const careerValue = getFieldValue(last.responses.future.carrera_opcion, '');
        const careerClarity = careerValue ? 1 : 0;
        insights_list.push({
          category: 'Vocación',
          change: careerClarity,
          label: careerClarity ? '✓ Carrera definida' : 'En búsqueda',
          icon: <Lightbulb className="w-4 h-4" />,
        });
      }

      if (first.responses.social && last.responses.social) {
        const groupValue = getFieldValue(last.responses.social.pertenencia_grupo, false);
        const hasGroup = groupValue ? 1 : -1;
        insights_list.push({
          category: 'Relaciones',
          change: hasGroup,
          label: hasGroup > 0 ? '✓ Sentido de pertenencia' : 'En construcción',
          icon: <Users className="w-4 h-4" />,
        });
      }

      setInsights(insights_list);
    }
  }, [formResponses]);

  const generateNarrative = async () => {
    setGeneratingNarrative(true);
    try {
      const response = await fetch('/api/ai/student-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          formResponses: sortedResponses,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  if (sortedResponses.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 text-center">
        <p className="text-neutral-400">No hay respuestas de formularios para este estudiante</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-blue-500/20 rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{studentName}</h2>
            <p className="text-neutral-400">Viaje de transformación académica y personal</p>
          </div>
          <div className="flex gap-3">
            {sortedResponses.length >= 2 && !narrative && (
              <button
                onClick={generateNarrative}
                disabled={generatingNarrative}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
              >
                {generatingNarrative ? (
                  <LoadingSpinner size="sm" label="Generando..." />
                ) : (
                  '✨ Generar Narrativa'
                )}
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
              >
                Exportar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {insights.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">{insight.icon}</span>
                  <p className="text-xs text-neutral-400 font-bold">{insight.category}</p>
                </div>
                <p className="text-sm text-white font-bold">{insight.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          Línea de Tiempo
        </h3>

        <div className="space-y-8">
          {sortedResponses.map((response, idx) => {
            const formTypeKey = response.formType as keyof typeof MOMENT_LABELS;
            const label = MOMENT_LABELS[formTypeKey] || response.formType;
            const date = MOMENT_DATES[formTypeKey] || '';
            const isFirst = idx === 0;
            const isLast = idx === sortedResponses.length - 1;

            return (
              <div key={response.id} className="flex gap-6">
                {/* Timeline marker */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      isFirst
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-neutral-700 border-neutral-600'
                    }`}
                  />
                  {!isLast && (
                    <div className="w-0.5 h-20 bg-gradient-to-b from-neutral-600 to-neutral-900 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1">
                  <div className="bg-black/40 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-white text-lg">{label}</p>
                        <p className="text-sm text-neutral-400">{date}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                        {response.formType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Moment Insights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {response.responses.academic?.desempeño && (
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <p className="text-xs text-neutral-400 mb-1">Académico</p>
                          <p className="text-sm text-white font-bold truncate">
                            {response.responses.academic.desempeño.substring(0, 20)}
                          </p>
                        </div>
                      )}
                      {response.responses.emotional?.bienestar && (
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <p className="text-xs text-neutral-400 mb-1">Bienestar</p>
                          <p className="text-sm text-white font-bold truncate">
                            {response.responses.emotional.bienestar.substring(0, 20)}
                          </p>
                        </div>
                      )}
                      {response.responses.future?.carrera_opcion && (
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <p className="text-xs text-neutral-400 mb-1">Vocación</p>
                          <p className="text-sm text-white font-bold truncate">
                            {response.responses.future.carrera_opcion.substring(0, 20)}
                          </p>
                        </div>
                      )}
                      {response.responses.spiritual?.importancia_fe && (
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <p className="text-xs text-neutral-400 mb-1">Espiritual</p>
                          <p className="text-sm text-white font-bold truncate">
                            {response.responses.spiritual.importancia_fe.substring(0, 20)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Narrative Section */}
      {narrative && (
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-blue-500/20 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Narrativa de Crecimiento
          </h3>
          <p className="text-neutral-200 leading-relaxed text-sm md:text-base">{narrative}</p>
        </div>
      )}
    </div>
  );
};

export default StudentJourney;
