'use client';

import { useState } from 'react';
import type { Goal, ActivityType } from '@/types';
import { saveGoal, deleteGoal, generateId } from '@/lib/storage';

interface GoalWithProgress extends Goal {
  current: number;
  activityType: ActivityType;
}

interface Props {
  goals: GoalWithProgress[];
  activityTypes: ActivityType[];
  onUpdate: () => void;
}

export default function GoalsSection({ goals, activityTypes, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [targetCount, setTargetCount] = useState(3);

  const handleAdd = () => {
    if (!selectedTypeId || targetCount < 1) return;
    saveGoal({ id: generateId(), typeId: selectedTypeId, targetCount });
    setSelectedTypeId('');
    setTargetCount(3);
    setShowAdd(false);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    onUpdate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">מטרות שבועיות</p>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full transition-colors"
        >
          {showAdd ? 'ביטול' : '+ הוסף מטרה'}
        </button>
      </div>

      {/* Add goal form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">בחר פעילות</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {activityTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTypeId(t.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    selectedTypeId === t.id
                      ? 'shadow-sm scale-105'
                      : 'border-transparent bg-gray-50'
                  }`}
                  style={selectedTypeId === t.id ? { borderColor: t.color, backgroundColor: `${t.color}15` } : {}}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[10px] font-medium text-gray-600 leading-tight">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">פעמים בשבוע</span>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-1.5">
              <button type="button" onClick={() => setTargetCount((c) => Math.max(1, c - 1))}
                className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold">−</button>
              <span className="w-5 text-center font-bold text-gray-800">{targetCount}</span>
              <button type="button" onClick={() => setTargetCount((c) => Math.min(14, c + 1))}
                className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold">+</button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedTypeId}
            className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-40 transition-all"
          >
            הוסף מטרה
          </button>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 && !showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-sm text-gray-400">עדיין אין מטרות</p>
          <p className="text-xs text-gray-300 mt-0.5">לחץ + הוסף מטרה כדי להתחיל</p>
        </div>
      )}

      <div className="space-y-3">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.targetCount) * 100));
          const done = goal.current >= goal.targetCount;

          return (
            <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${goal.activityType.color}20` }}
                >
                  {goal.activityType.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{goal.activityType.name}</p>
                  <p className="text-xs text-gray-400">מטרה שבועית</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${done ? 'text-green-600' : 'text-gray-700'}`}>
                    {goal.current}/{goal.targetCount}
                  </span>
                  {done && <span className="text-base">✅</span>}
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: done
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : `linear-gradient(90deg, ${goal.activityType.color}cc, ${goal.activityType.color})`,
                  }}
                />
              </div>

              {/* Milestones dots */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {Array.from({ length: goal.targetCount }, (_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i < goal.current
                        ? (done ? '#22c55e' : goal.activityType.color)
                        : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
