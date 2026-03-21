'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import WeekSelector from '@/components/layout/WeekSelector';
import DayColumn from '@/components/schedule/DayColumn';
import ActivityDetailDrawer from '@/components/schedule/ActivityDetailDrawer';
import {
  getActivities,
  getActivityTypes,
  getWeek,
  saveActivity,
  deleteActivity,
  saveWeek,
} from '@/lib/storage';
import { getCurrentWeekId, getWeekStartDate, formatDateKey } from '@/lib/utils';
import type { Activity, ActivityType, WeekData, DayLoad } from '@/types';

export default function SchedulePage() {
  const [weekId, setWeekId] = useState(getCurrentWeekId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const loadData = useCallback(() => {
    setActivities(getActivities(weekId));
    setActivityTypes(getActivityTypes());
    const existing = getWeek(weekId);
    if (existing) {
      setWeekData(existing);
    } else {
      const start = getWeekStartDate(weekId);
      const end = new Date(start.getTime());
      end.setUTCDate(end.getUTCDate() + 6);
      const newWeek: WeekData = {
        id: weekId,
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
        dayLabels: [null, null, null, null, null, null, null],
      };
      saveWeek(newWeek);
      setWeekData(newWeek);
    }
  }, [weekId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload when returning to app or when activities are updated
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const current = getCurrentWeekId();
        setWeekId((prev) => (prev === current ? prev : current));
        loadData();
      }
    };
    const handleActivitiesUpdated = () => loadData();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('activitiesUpdated', handleActivitiesUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('activitiesUpdated', handleActivitiesUpdated);
    };
  }, [loadData]);

  const handleDelete = (id: string) => {
    deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveFromDrawer = (updated: Activity) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteFromDrawer = (id: string) => {
    deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDayLabel = (dayOfWeek: number, label: DayLoad) => {
    if (!weekData) return;
    const newLabels = [...weekData.dayLabels] as DayLoad[];
    newLabels[dayOfWeek] = label;
    const updated = { ...weekData, dayLabels: newLabels };
    saveWeek(updated);
    setWeekData(updated);
  };

  // DnD sensors — require 8px movement before activating (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which day these activities belong to
    const activeActivity = activities.find((a) => a.id === active.id);
    const overActivity = activities.find((a) => a.id === over.id);
    if (!activeActivity || !overActivity || activeActivity.dayOfWeek !== overActivity.dayOfWeek) return;

    const day = activeActivity.dayOfWeek;
    const dayActivities = activities
      .filter((a) => a.dayOfWeek === day)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

    const oldIndex = dayActivities.findIndex((a) => a.id === active.id);
    const newIndex = dayActivities.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(dayActivities, oldIndex, newIndex);

    // Assign new order values and save
    const updated = reordered.map((a, i) => ({ ...a, order: i }));
    updated.forEach(saveActivity);

    setActivities((prev) => {
      const otherDays = prev.filter((a) => a.dayOfWeek !== day);
      return [...otherDays, ...updated];
    });
  };

  const weekStart = getWeekStartDate(weekId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm px-3 pt-3 pb-2">
        <WeekSelector currentWeekId={weekId} onWeekChange={setWeekId} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto" style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 p-3 min-w-max" style={{ minWidth: '1250px' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const dayDate = new Date(weekStart.getTime());
              dayDate.setUTCDate(dayDate.getUTCDate() + i);
              return (
                <DayColumn
                  key={i}
                  date={dayDate}
                  dayOfWeek={i}
                  activities={activities.filter((a) => a.dayOfWeek === i)}
                  activityTypes={activityTypes}
                  dayLabel={weekData?.dayLabels[i] ?? null}
                  weekId={weekId}
                  onDelete={handleDelete}
                  onSetDayLabel={handleSetDayLabel}
                  onOpenDetail={setSelectedActivity}
                />
              );
            })}
          </div>
        </div>
      </DndContext>

      {selectedActivity && (() => {
        const actType = activityTypes.find((t) => t.id === selectedActivity.typeId);
        if (!actType) return null;
        return (
          <ActivityDetailDrawer
            activity={selectedActivity}
            activityType={actType}
            onClose={() => setSelectedActivity(null)}
            onSave={handleSaveFromDrawer}
            onDelete={handleDeleteFromDrawer}
          />
        );
      })()}
    </div>
  );
}
