import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { JSX } from 'react';

interface FormResponseCardProps {
  category: string;
  data: Record<string, any>;
  previousData?: Record<string, any>;
}

export const FormResponseCard: React.FC<FormResponseCardProps> = ({
  category,
  data,
  previousData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (cat: string): string => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-50 border-blue-200 text-blue-700',
      academic: 'bg-green-50 border-green-200 text-green-700',
      social: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      personal_traits: 'bg-pink-50 border-pink-200 text-pink-700',
      emotional: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      family: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      spiritual: 'bg-purple-50 border-purple-200 text-purple-700',
      future: 'bg-orange-50 border-orange-200 text-orange-700',
    };
    return colors[cat] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getChangeIndicator = (key: string): JSX.Element | null => {
    if (!previousData || previousData[key] === undefined) return null;

    const prev = previousData[key];
    const current = data[key];

    if (typeof prev === 'number' && typeof current === 'number') {
      if (current > prev) return <TrendingUp className="w-3 h-3 text-green-400" />;
      if (current < prev) return <TrendingDown className="w-3 h-3 text-red-400" />;
      return <Minus className="w-3 h-3 text-neutral-400" />;
    }

    if (JSON.stringify(prev) !== JSON.stringify(current)) {
      return <Minus className="w-3 h-3 text-yellow-400" />;
    }

    return null;
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value || '');
  };

  const categoryLabel = category.replace(/_/g, ' ');

  return (
    <div className={`border rounded-lg p-4 cursor-pointer transition-all ${getCategoryColor(category)}`}>
      <div
        className="flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm uppercase tracking-wider">{categoryLabel}</span>
          {!isExpanded && (
            <span className="text-xs text-gray-500">
              ({Object.keys(data).filter(k => data[k]).length} campos)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 pt-4 border-t border-current border-opacity-20">
          {Object.entries(data).map(([key, value]) => (
            value !== undefined && value !== null && value !== '' && (
              <div key={key} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-gray-700 font-mono">{key.replace(/_/g, ' ')}:</span>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-gray-900">{formatValue(value)}</span>
                  {getChangeIndicator(key)}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default FormResponseCard;
