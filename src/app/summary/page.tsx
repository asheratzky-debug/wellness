'use client';

import { useState, useEffect } from 'react';
import WeekSelector from '@/components/layout/WeekSelector';
import { getActivities, getActivityTypes, getHealthData } from '@/lib/storage';
import { getCurrentWeekId, getWeekDateRange, formatDateKey } from '@/lib/utils';
import type { ActivityType } from '@/types';

interface BreakdownItem {
  type: ActivityType;
  count: number;
}

interface CategoryData {
  key: string;
  label: string;
  icon: string;
  color: string;
  total: number;
  breakdown: BreakdownItem[];
}

function StatCard({
  data,
  onClick,
  open,
}: {
  data: CategoryData;
  onClick: () => void;
  open: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-gray-800">{data.label}</p>
        </div>
        <span className="text-2xl font-bold" style={{ color: data.color }}>{data.total}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && data.breakdown.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {data.breakdown.map((item) => (
            <div key={item.type.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-lg">{item.type.icon}</span>
              <span className="flex-1 text-sm text-gray-700">{item.type.name}</span>
              <span className="text-sm font-bold" style={{ color: item.type.color }}>
                ×{item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SummaryPage() {
  const [weekId, setWeekId] = useState(getCurrentWeekId);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [avgSleep, setAvgSleep] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const activities = getActivities(weekId);
    const types = getActivityTypes();
    const typeMap = new Map(types.map((t) => [t.id, t]));

    const CATEGORIES = [
      { key: 'training', label: 'אימונים', icon: '⚽', color: '#ef4444' },
      { key: 'recovery', label: 'התאוששות', icon: '🧘', color: '#3b82f6' },
      { key: 'health',   label: 'בריאות',   icon: '❤️', color: '#ec4899' },
      { key: 'other',    label: 'אחר',       icon: '📌', color: '#6b7280' },
    ];

    const built: CategoryData[] = [];
    let grandTotal = 0;

    for (const cat of CATEGORIES) {
      const catActivities = activities.filter(
        (a) => typeMap.get(a.typeId)?.category === cat.key
      );
      if (catActivities.length === 0) continue;

      // Group by typeId, summing count
      const countMap = new Map<string, number>();
      for (const a of catActivities) {
        const c = a.count ?? 1;
        countMap.set(a.typeId, (countMap.get(a.typeId) ?? 0) + c);
      }

      const catTotal = [...countMap.values()].reduce((s, v) => s + v, 0);
      grandTotal += catTotal;

      const breakdown: BreakdownItem[] = [...countMap.entries()]
        .map(([typeId, count]) => ({ type: typeMap.get(typeId), count }))
        .filter((b): b is BreakdownItem => b.type !== undefined)
        .sort((a, b) => b.count - a.count);

      built.push({ ...cat, total: catTotal, breakdown });
    }

    setCategories(built);
    setTotal(grandTotal);

    // Sleep average
    const { start } = getWeekDateRange(weekId);
    let totalSleep = 0, sleepCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime());
      d.setUTCDate(d.getUTCDate() + i);
      const h = getHealthData(formatDateKey(d));
      if (h?.sleepHours) { totalSleep += h.sleepHours; sleepCount++; }
    }
    setAvgSleep(sleepCount > 0 ? totalSleep / sleepCount : null);
  }, [weekId]);

  const toggle = (key: string) => setOpenCategory((prev) => (prev === key ? null : key));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">סיכום שבועי</h1>
        <p className="text-sm text-gray-500 mt-0.5">סטטיסטיקות השבוע</p>
      </div>

      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <WeekSelector currentWeekId={weekId} onWeekChange={setWeekId} />
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {total === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-3">📊</span>
            <p className="text-sm">אין נתונים לשבוע זה</p>
            <p className="text-xs mt-1">הוסף פעילויות כדי לראות סיכום</p>
          </div>
        ) : (
          <>
            {/* Total */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">סה״כ פעילויות השבוע</span>
              <span className="text-2xl font-bold text-gray-900">{total}</span>
            </div>

            {/* Per-category expandable cards */}
            {categories.map((cat) => (
              <StatCard
                key={cat.key}
                data={cat}
                open={openCategory === cat.key}
                onClick={() => toggle(cat.key)}
              />
            ))}

            {/* Sleep */}
            {avgSleep !== null && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😴</span>
                  <span className="text-sm font-semibold text-gray-700">ממוצע שינה</span>
                </div>
                <span className={`text-2xl font-bold ${avgSleep >= 7 ? 'text-green-600' : avgSleep >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {avgSleep.toFixed(1)}h
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
