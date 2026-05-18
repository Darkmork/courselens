import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
      personal: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      academic: 'bg-green-500/10 border-green-500/30 text-green-300',
      social: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      personal_traits: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
      emotional: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      family: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      spiritual: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      future: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    };
    return colors[cat] || 'bg-neutral-500/10 border-neutral-500/30 text-neutral-300';
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
            <span className="text-xs text-neutral-400">
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
                <span className="text-neutral-300 font-mono">{key.replace(/_/g, ' ')}:</span>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-neutral-200">{formatValue(value)}</span>
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
