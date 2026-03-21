'use client';

import { useState, useEffect } from 'react';
import WeekSelector from '@/components/layout/WeekSelector';
import { generateInsights } from '@/lib/insights';
import { getCurrentWeekId } from '@/lib/utils';
import type { Insight } from '@/types';

const TYPE_STYLES: Record<Insight['type'], { bg: string; border: string; icon: string; label: string }> = {
  warning: { bg: 'bg-red-50', border: 'border-red-200', icon: '⚠️', label: 'אזהרה' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', label: 'מעולה' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', label: 'מידע' },
  tip: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '💡', label: 'טיפ' },
};

export default function InsightsPage() {
  const [weekId, setWeekId] = useState(getCurrentWeekId);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    setInsights(generateInsights(weekId));
  }, [weekId]);

  const warnings = insights.filter((i) => i.type === 'warning');
  const successes = insights.filter((i) => i.type === 'success');
  const tips = insights.filter((i) => i.type === 'tip');
  const infos = insights.filter((i) => i.type === 'info');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">תובנות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניתוח מבוסס על הנתונים שלך</p>
      </div>

      {/* Week selector */}
      <div className="bg-white border-b border-gray-100 px-3 py-2">
        <WeekSelector currentWeekId={weekId} onWeekChange={setWeekId} />
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {insights.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-3">🧠</span>
            <p className="text-sm">אין מספיק נתונים לשבוע זה</p>
            <p className="text-xs mt-1">הוסף פעילויות ומדדי בריאות כדי לקבל תובנות</p>
          </div>
        )}

        {warnings.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">אזהרות</h2>
            <div className="space-y-2">
              {warnings.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        )}

        {successes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">הישגים</h2>
            <div className="space-y-2">
              {successes.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        )}

        {tips.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">המלצות</h2>
            <div className="space-y-2">
              {tips.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        )}

        {infos.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">מידע</h2>
            <div className="space-y-2">
              {infos.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const styles = TYPE_STYLES[insight.type];
  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none shrink-0">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{insight.title}</p>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}
