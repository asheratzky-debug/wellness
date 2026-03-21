'use client';

import { useMemo } from 'react';
import {
  getWeekDateRange,
  formatHebrewDateRange,
  getAdjacentWeekId,
  getCurrentWeekId,
} from '@/lib/utils';

interface WeekSelectorProps {
  currentWeekId: string;
  onWeekChange: (weekId: string) => void;
}

export default function WeekSelector({
  currentWeekId,
  onWeekChange,
}: WeekSelectorProps) {
  const isCurrentWeek = currentWeekId === getCurrentWeekId();

  const displayLabel = useMemo(() => {
    const range = getWeekDateRange(currentWeekId);
    return formatHebrewDateRange(range.start, range.end);
  }, [currentWeekId]);

  const handlePrevWeek = () => {
    onWeekChange(getAdjacentWeekId(currentWeekId, -1));
  };

  const handleNextWeek = () => {
    onWeekChange(getAdjacentWeekId(currentWeekId, 1));
  };

  const handleToday = () => {
    onWeekChange(getCurrentWeekId());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between gap-2">
      {/* Right arrow (previous week in RTL) */}
      <button
        onClick={handlePrevWeek}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
        aria-label="שבוע קודם"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Week label */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">{displayLabel}</span>
        {!isCurrentWeek && (
          <button
            onClick={handleToday}
            className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full transition-colors duration-150"
          >
            היום
          </button>
        )}
      </div>

      {/* Left arrow (next week in RTL) */}
      <button
        onClick={handleNextWeek}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
        aria-label="שבוע הבא"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
