import React from 'react';
import { FormResponse } from '../types/FormResponse';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GrowthComparativeProps {
  responses: FormResponse[];
}

export const GrowthComparative: React.FC<GrowthComparativeProps> = ({ responses }) => {
  const first = responses[0];
  const last = responses[responses.length - 1];

  if (!first || !last) {
    return <div className="text-neutral-400">No hay datos suficientes para comparar</div>;
  }

  const categories = [
    { key: 'academic', label: 'Académico' },
    { key: 'social', label: 'Social' },
    { key: 'emotional', label: 'Emocional' },
    { key: 'personal', label: 'Personal' },
    { key: 'family', label: 'Familiar' },
    { key: 'spiritual', label: 'Espiritual' },
    { key: 'future', label: 'Futuro' },
  ];

  const getChangeIndicator = (prev: any, current: any) => {
    if (prev === undefined || current === undefined) return null;

    if (typeof prev === 'number' && typeof current === 'number') {
      if (current > prev) return <TrendingUp className="w-3 h-3 text-green-400" aria-label="Mejoró" />;
      if (current < prev) return <TrendingDown className="w-3 h-3 text-red-400" aria-label="Disminuyó" />;
      return <Minus className="w-3 h-3 text-neutral-400" aria-label="Sin cambios" />;
    }

    if (JSON.stringify(prev) !== JSON.stringify(current)) {
      return <span className="text-xs text-yellow-400">●</span>;
    }

    return null;
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value || '—');
  };

  return (
    <div className="space-y-6">
      {categories.map(({ key, label }) => {
        const firstData = first.responses[key as keyof typeof first.responses];
        const lastData = last.responses[key as keyof typeof last.responses];

        if (!firstData && !lastData) return null;

        return (
          <div key={key} className="border border-white/10 rounded-lg overflow-hidden">
            <div className="bg-white/5 px-4 py-3 font-bold text-white text-sm uppercase tracking-wider border-b border-white/10">
              {label}
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10">
              {/* Left side - First response */}
              <div className="p-4 space-y-2">
                <div className="text-xs text-neutral-400 font-mono mb-3">
                  {new Date(first.timestamp).toLocaleDateString('es-CL')}
                </div>
                {firstData ? (
                  Object.entries(firstData).map(([fieldKey, value]) => (
                    value !== undefined && value !== null && (
                      <div key={fieldKey} className="text-xs">
                        <div className="text-neutral-400 font-mono">{fieldKey.replace(/_/g, ' ')}</div>
                        <div className="text-neutral-200">{formatValue(value)}</div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="text-xs text-neutral-500">Sin datos</div>
                )}
              </div>

              {/* Right side - Last response */}
              <div className="p-4 space-y-2">
                <div className="text-xs text-neutral-400 font-mono mb-3">
                  {new Date(last.timestamp).toLocaleDateString('es-CL')}
                </div>
                {lastData ? (
                  Object.entries(lastData).map(([fieldKey, value]) => {
                    const prevValue = firstData?.[fieldKey as keyof typeof firstData];
                    return (
                      value !== undefined && value !== null && (
                        <div key={fieldKey} className="text-xs flex justify-between items-start gap-2">
                          <div>
                            <div className="text-neutral-400 font-mono">{fieldKey.replace(/_/g, ' ')}</div>
                            <div className="text-neutral-200">{formatValue(value)}</div>
                          </div>
                          {getChangeIndicator(prevValue, value)}
                        </div>
                      )
                    );
                  })
                ) : (
                  <div className="text-xs text-neutral-500">Sin datos</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GrowthComparative;
