'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getActivityTypes, saveActivity, generateId } from '@/lib/storage';
import { getCurrentWeekId } from '@/lib/utils';
import type { ActivityType } from '@/types';
import { DAY_NAMES, CATEGORY_LABELS } from '@/lib/constants';

const CATEGORY_ORDER = ['training', 'recovery', 'health', 'other'];

function AddActivityForm() {
  const router = useRouter();
  const params = useSearchParams();

  const weekId = params.get('weekId') ?? getCurrentWeekId();
  const defaultDay = parseInt(params.get('day') ?? String(new Date().getDay()), 10);

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
  // Map from typeId → count (selected if present)
  const [selected, setSelected] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    setActivityTypes(getActivityTypes());
  }, []);

  const grouped = CATEGORY_ORDER.reduce<Record<string, ActivityType[]>>((acc, cat) => {
    const items = activityTypes.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const toggleType = (id: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, 1);
      return next;
    });
  };

  const changeCount = (id: string, delta: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(id) ?? 1;
      const newVal = cur + delta;
      if (newVal <= 0) next.delete(id);
      else next.set(id, newVal);
      return next;
    });
  };

  const handleSave = () => {
    if (selected.size === 0) return;
    for (const [typeId, count] of selected) {
      saveActivity({
        id: generateId(),
        weekId,
        dayOfWeek,
        typeId,
        count,
        status: 'planned',
        notes: '',
      });
    }
    window.dispatchEvent(new Event('activitiesUpdated'));
    router.push('/schedule');
  };

  const totalSelected = selected.size;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">הוספת פעילויות</h1>
      </div>

      {/* Day selector */}
      <div className="bg-white border-b border-gray-100 px-3 py-3">
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((name, i) => (
            <button key={i} type="button" onClick={() => setDayOfWeek(i)}
              className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-all ${
                dayOfWeek === i ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Activity grid */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 pt-4 pb-32 space-y-4">
        {Object.entries(grouped).map(([category, types]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {types.map((t) => {
                const count = selected.get(t.id);
                const isSelected = count !== undefined;
                return (
                  <div key={t.id} className="flex flex-col">
                    <button type="button" onClick={() => toggleType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        isSelected ? 'shadow-md scale-105' : 'border-transparent bg-white shadow-sm hover:scale-105'
                      }`}
                      style={isSelected ? { backgroundColor: `${t.color}22`, borderColor: t.color } : {}}>
                      <span className="text-3xl leading-none">{t.icon}</span>
                      <span className="text-[11px] font-medium text-center leading-tight"
                        style={{ color: isSelected ? t.color : '#6b7280' }}>
                        {t.name}
                      </span>
                    </button>

                    {/* Count controls — visible only when selected */}
                    {isSelected && (
                      <div className="flex items-center justify-center gap-2 mt-1.5">
                        <button type="button" onClick={() => changeCount(t.id, -1)}
                          className="w-6 h-6 rounded-full bg-white shadow text-gray-500 text-sm font-bold flex items-center justify-center hover:bg-gray-100 transition-colors">
                          −
                        </button>
                        <span className="text-sm font-bold w-4 text-center" style={{ color: t.color }}>
                          {count}
                        </span>
                        <button type="button" onClick={() => changeCount(t.id, 1)}
                          className="w-6 h-6 rounded-full bg-white shadow text-gray-500 text-sm font-bold flex items-center justify-center hover:bg-gray-100 transition-colors">
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3">
        <div className="max-w-lg mx-auto">
          <button type="button" onClick={handleSave} disabled={totalSelected === 0}
            className="w-full py-3.5 rounded-2xl font-semibold text-base text-white transition-all shadow-lg disabled:opacity-40 active:scale-95 bg-green-500 hover:bg-green-600">
            {totalSelected === 0
              ? 'בחר פעילויות'
              : `הוסף ${totalSelected} פעילות${totalSelected > 1 ? '' : ''} ליום ${DAY_NAMES[dayOfWeek]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddActivityPage() {
  return (
    <Suspense>
      <AddActivityForm />
    </Suspense>
  );
}
