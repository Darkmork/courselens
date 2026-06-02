import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FormResponse } from '../types/FormResponse';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import FormResponseCard from './FormResponseCard';
import GrowthComparative from './GrowthComparative';

interface StudentGrowthTimelineProps {
  studentId: string;
}

export const StudentGrowthTimeline: React.FC<StudentGrowthTimelineProps> = ({ studentId }) => {
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparative, setShowComparative] = useState(false);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);

  // Load form responses
  useEffect(() => {
    const q = query(
      collection(db, 'students', studentId, 'formResponses'),
      where('formType', 'in', ['inicio_III_medio', 'fin_I_semestre', 'inicio_IV_medio'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responses = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FormResponse))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setFormResponses(responses);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  const generateNarrative = async () => {
    setGeneratingNarrative(true);
    try {
      const response = await fetch('/api/ai/generate-growth-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          formResponses,
        }),
      });

      const data = await response.json();
      if (data.narrative) {
        setNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-gray-500">Cargando datos de crecimiento...</div>;
  }

  if (formResponses.length === 0) {
    return (
      <div className="p-6 text-gray-500 text-center">
        No hay respuestas de formulario registradas para este estudiante.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Timeline de Crecimiento</h3>
          <p className="text-xs text-gray-500 mt-1">
            {formResponses.length} formulario{formResponses.length !== 1 ? 's' : ''} registrado{formResponses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowComparative(!showComparative)}
            className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-mono border border-blue-200 transition-all"
          >
            {showComparative ? 'Timeline' : 'Comparativas'}
          </button>
          <button
            onClick={generateNarrative}
            disabled={generatingNarrative || formResponses.length < 2}
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm font-mono border border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generatingNarrative ? 'Generando...' : 'Relato de IA'}
          </button>
        </div>
      </div>

      {/* Narrative Modal/Section */}
      {narrative && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-xl p-6">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-gray-900">Relato de Crecimiento</h4>
            <button
              onClick={() => setNarrative(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{narrative}</p>
          <button
            onClick={() => navigator.clipboard.writeText(narrative)}
            className="mt-4 text-xs px-3 py-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200"
          >
            Copiar
          </button>
        </div>
      )}

      {/* Timeline or Comparative View */}
      {showComparative ? (
        <GrowthComparative responses={formResponses} />
      ) : (
        <div className="space-y-8">
          {formResponses.map(response => (
            <div key={response.id}>
              <div className="text-sm font-mono text-gray-500 mb-3">
                {new Date(response.timestamp).toLocaleDateString('es-CL')} • {response.formType.replace(/_/g, ' ')}
              </div>
              <div className="space-y-3">
                {Object.entries(response.responses).map(([category, data]) => (
                  data && Object.keys(data).length > 0 && (
                    <FormResponseCard
                      key={category}
                      category={category}
                      data={data}
                      previousData={
                        formResponses.indexOf(response) > 0
                          ? formResponses[formResponses.indexOf(response) - 1].responses[category as keyof typeof response.responses]
                          : undefined
                      }
                    />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentGrowthTimeline;
