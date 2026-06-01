import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears?: number[];
}

import { DEFAULT_YEARS } from '../lib/constants';

export function YearSelector({
  selectedYear,
  onYearChange,
  availableYears = DEFAULT_YEARS
}: YearSelectorProps) {
  const years = [...availableYears];

  // Fix Issue 3: Handle edge case where selectedYear is not in availableYears
  let currentIndex = years.indexOf(selectedYear);
  if (currentIndex === -1) {
    console.warn(`YearSelector: selectedYear ${selectedYear} not found in availableYears [${years.join(', ')}], defaulting to ${years[0]}`);
    currentIndex = 0;
  }

  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < years.length - 1;

  const goToPrevious = () => {
    if (canGoBack) {
      onYearChange(years[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      onYearChange(years[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        disabled={!canGoBack}
        className="p-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
        aria-label="Ir al año anterior"
        title="Año anterior"
      >
        <ChevronLeft className="h-5 w-5 text-neutral-400" />
      </button>

      {/* Year Tabs */}
      <div className="flex gap-2 bg-neutral-900 rounded-lg border border-white/10 p-1">
        {years.map((year) => (
          <button
            key={`year-${year}`}
            onClick={() => onYearChange(year)}
            className={`px-4 py-2 rounded font-medium transition ${
              selectedYear === year
                ? 'bg-blue-600 text-white'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
            aria-label={`Año ${year}`}
            aria-pressed={selectedYear === year}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={goToNext}
        disabled={!canGoNext}
        className="p-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
        aria-label="Ir al año siguiente"
        title="Año siguiente"
      >
        <ChevronRight className="h-5 w-5 text-neutral-400" />
      </button>
    </div>
  );
}

export default YearSelector;
