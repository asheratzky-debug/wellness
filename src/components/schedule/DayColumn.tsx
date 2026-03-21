'use client';

import Link from 'next/link';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Activity, ActivityType, DayLoad } from '@/types';
import { DAY_NAMES, LOAD_LABELS } from '@/lib/constants';
import { isToday } from '@/lib/utils';
import ActivityBlock from '@/components/schedule/ActivityBlock';

const LOAD_CYCLE: DayLoad[] = [null, 'light', 'medium', 'heavy'];

const LOAD_BADGE_STYLES: Record<string, string> = {
  light: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  heavy: 'bg-red-100 text-red-700',
};

interface DayColumnProps {
  date: Date;
  dayOfWeek: number;
  activities: Activity[];
  activityTypes: ActivityType[];
  dayLabel: DayLoad;
  weekId: string;
  onDelete: (id: string) => void;
  onSetDayLabel: (dayOfWeek: number, label: DayLoad) => void;
  onOpenDetail: (activity: Activity) => void;
}

export default function DayColumn({
  date,
  dayOfWeek,
  activities,
  activityTypes,
  dayLabel,
  weekId,
  onDelete,
  onSetDayLabel,
  onOpenDetail,
}: DayColumnProps) {
  const today = isToday(date);

  const sorted = [...activities].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return (a.startTime ?? '').localeCompare(b.startTime ?? '');
  });

  const activityTypeMap = new Map(activityTypes.map((t) => [t.id, t]));

  const handleCycleLoad = () => {
    const next = LOAD_CYCLE[(LOAD_CYCLE.indexOf(dayLabel) + 1) % LOAD_CYCLE.length];
    onSetDayLabel(dayOfWeek, next);
  };

  return (
    <div className={`flex flex-col rounded-xl border transition-colors duration-150 min-w-[170px] flex-1
      ${today ? 'border-green-300 bg-green-50/40 shadow-sm' : 'border-gray-200 bg-white'}`}>

      {/* Header */}
      <div className={`px-2 py-2 text-center border-b ${today ? 'border-green-200' : 'border-gray-100'}`}>
        <p className={`text-xs font-bold ${today ? 'text-green-700' : 'text-gray-700'}`}>
          {DAY_NAMES[dayOfWeek]}
        </p>
        <p className={`text-lg font-semibold ${today ? 'text-green-600' : 'text-gray-900'}`}>
          {date.getUTCDate()}
        </p>
        <button type="button" onClick={handleCycleLoad}
          className={`mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
            dayLabel ? LOAD_BADGE_STYLES[dayLabel] : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}>
          {dayLabel ? LOAD_LABELS[dayLabel] : 'עומס'}
        </button>
      </div>

      {/* Activities */}
      <div className="p-1.5 space-y-1.5">
        <SortableContext items={sorted.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {sorted.length > 0 ? sorted.map((activity) => {
            const activityType = activityTypeMap.get(activity.typeId);
            if (!activityType) return null;
            return (
              <ActivityBlock
                key={activity.id}
                activity={activity}
                activityType={activityType}
                onDelete={onDelete}
                onOpenDetail={onOpenDetail}
              />
            );
          }) : (
            <p className="text-center text-[11px] text-gray-300 py-4">אין פעילויות</p>
          )}
        </SortableContext>
      </div>

      {/* Add button */}
      <div className="p-1.5 border-t border-gray-100">
        <Link href={`/add-activity?day=${dayOfWeek}&weekId=${weekId}`}
          className="flex items-center justify-center w-full py-1.5 rounded-lg
                     text-gray-400 hover:text-green-600 hover:bg-green-50
                     transition-colors duration-150 text-lg">
          +
        </Link>
      </div>
    </div>
  );
}
