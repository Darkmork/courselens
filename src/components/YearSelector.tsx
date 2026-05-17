import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears?: number[];
}

const DEFAULT_YEARS = [2024, 2025, 2026, 2027];

export function YearSelector({
  selectedYear,
  onYearChange,
  availableYears = DEFAULT_YEARS
}: YearSelectorProps) {
  const years = availableYears.sort((a, b) => a - b);
  const currentIndex = years.indexOf(selectedYear);
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
        className="p-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
        aria-label="Año anterior"
        title="Año anterior"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>

      {/* Year Tabs */}
      <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`px-4 py-2 rounded font-medium transition ${
              selectedYear === year
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label={`Sociograma ${year}`}
            aria-current={selectedYear === year ? 'page' : undefined}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={goToNext}
        disabled={!canGoNext}
        className="p-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
        aria-label="Año siguiente"
        title="Año siguiente"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}

export default YearSelector;
