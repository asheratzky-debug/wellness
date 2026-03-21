'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Activity, ActivityType } from '@/types';

interface ActivityBlockProps {
  activity: Activity;
  activityType: ActivityType;
  onDelete: (id: string) => void;
  onOpenDetail: (activity: Activity) => void;
}

export default function ActivityBlock({ activity, activityType, onDelete, onOpenDetail }: ActivityBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative w-full text-right rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Colored right border */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 rounded-r-lg"
        style={{ backgroundColor: activityType.color }}
      />

      <div className="pr-3 pl-1 py-2.5 flex items-center gap-1.5">
        {/* Drag handle — desktop only */}
        <span
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="hidden md:block text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing text-sm shrink-0 select-none"
          aria-label="גרור לסידור"
        >
          ⠿
        </span>

        {/* Tappable body opens detail drawer */}
        <button
          type="button"
          onClick={() => onOpenDetail(activity)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-right"
        >
          <span className="text-lg leading-none shrink-0">{activityType.icon}</span>
          <span className="text-xs font-semibold text-gray-800 truncate flex-1">
            {activityType.name}
          </span>
          {activity.count && activity.count > 1 && (
            <span className="text-xs font-bold text-gray-400 shrink-0">×{activity.count}</span>
          )}
          {activity.notes ? (
            <span className="text-xs shrink-0" title="יש הערות">📝</span>
          ) : null}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(activity.id)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100
                     w-5 h-5 flex items-center justify-center rounded-full
                     text-gray-400 hover:text-red-500 hover:bg-red-50
                     transition-all duration-150 text-xs shrink-0"
          aria-label="מחיקה"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
