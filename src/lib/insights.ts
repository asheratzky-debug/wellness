import type { Insight, DailyHealth } from '@/types';
import { getActivities, getHealthData, getActivityTypes } from '@/lib/storage';
import { getWeekDateRange } from '@/lib/utils';
import { DAY_NAMES } from '@/lib/constants';

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateInsights(weekId: string): Insight[] {
  const insights: Insight[] = [];
  const { start } = getWeekDateRange(weekId);
  const activities = getActivities(weekId);
  const types = getActivityTypes();
  const typeMap = new Map(types.map((t) => [t.id, t]));

  // Gather health data for the week
  const weekHealthData: (DailyHealth | undefined)[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    weekHealthData.push(getHealthData(formatDate(d)));
  }
  const healthEntries = weekHealthData.filter(Boolean) as DailyHealth[];

  // Count activities by category (using count field)
  const countOf = (predicate: (typeCategory: string) => boolean) =>
    activities
      .filter((a) => predicate(typeMap.get(a.typeId)?.category ?? ''))
      .reduce((sum, a) => sum + (a.count ?? 1), 0);

  const trainingCount = countOf((c) => c === 'training');
  const recoveryCount = countOf((c) => c === 'recovery');

  // ─── Rule 1: Overload (3+ consecutive heavy training days) ───
  let consecutiveHeavy = 0;
  let maxConsecutiveHeavy = 0;
  for (let i = 0; i < 7; i++) {
    const dayTraining = activities.filter(
      (a) => a.dayOfWeek === i && typeMap.get(a.typeId)?.category === 'training'
    );
    const dayTotal = dayTraining.reduce((s, a) => s + (a.count ?? 1), 0);
    const health = weekHealthData[i];
    const isHeavy = dayTotal >= 2 || (health?.fatigueLevel !== undefined && health.fatigueLevel >= 7);
    if (isHeavy) {
      consecutiveHeavy++;
      maxConsecutiveHeavy = Math.max(maxConsecutiveHeavy, consecutiveHeavy);
    } else {
      consecutiveHeavy = 0;
    }
  }
  if (maxConsecutiveHeavy >= 3) {
    insights.push({
      id: 'overload',
      type: 'warning',
      icon: '🔥',
      title: 'עומס יתר',
      message: `${maxConsecutiveHeavy} ימים רצופים של אימון כבד. מומלץ יום התאוששות`,
      priority: 10,
    });
  }

  // ─── Rule 2: Low recovery ratio ──────────────────────────────
  if (trainingCount > 0 && recoveryCount === 0) {
    insights.push({
      id: 'no-recovery',
      type: 'warning',
      icon: '⚖️',
      title: 'חסר התאוששות',
      message: 'אין סשני התאוששות השבוע. הוסף מתיחות, סאונה או טיפול',
      priority: 8,
    });
  } else if (recoveryCount > 0 && trainingCount / recoveryCount > 3) {
    insights.push({
      id: 'low-recovery-ratio',
      type: 'warning',
      icon: '⚖️',
      title: 'יחס אימון/התאוששות',
      message: 'יחס אימון/התאוששות לא מאוזן. הוסף סשני התאוששות',
      priority: 8,
    });
  }

  // ─── Rule 3: Low sleep ────────────────────────────────────────
  const sleepEntries = healthEntries.filter((h) => h.sleepHours !== undefined);
  const lowSleepDays = weekHealthData
    .map((h, i) => (h?.sleepHours !== undefined && h.sleepHours < 6 ? DAY_NAMES[i] : null))
    .filter((d): d is string => d !== null);
  if (lowSleepDays.length >= 2) {
    insights.push({
      id: 'low-sleep',
      type: 'warning',
      icon: '😴',
      title: 'שינה קצרה',
      message: `פחות מ-6 שעות ב-${lowSleepDays.join(', ')}. נסה לישון יותר`,
      priority: 7,
    });
  }

  // ─── Rule 4: Good balance ─────────────────────────────────────
  if (recoveryCount > 0 && trainingCount > 0) {
    const ratio = trainingCount / recoveryCount;
    if (ratio >= 1 && ratio <= 3) {
      insights.push({
        id: 'good-balance',
        type: 'success',
        icon: '✅',
        title: 'איזון מעולה',
        message: 'איזון טוב בין אימון להתאוששות השבוע',
        priority: 5,
      });
    }
  }

  // ─── Rule 5: Good sleep trend ─────────────────────────────────
  const sleepValues = sleepEntries.map((h) => h.sleepHours!);
  const avgSleep = sleepValues.length > 0
    ? sleepValues.reduce((s, v) => s + v, 0) / sleepValues.length
    : 0;
  if (avgSleep >= 7.5) {
    insights.push({
      id: 'good-sleep',
      type: 'success',
      icon: '🌟',
      title: 'שינה מצוינת',
      message: `ממוצע שינה ${avgSleep.toFixed(1)} שעות השבוע — כל הכבוד!`,
      priority: 4,
    });
  }

  // ─── Rule 6: Weekly summary ───────────────────────────────────
  const summaryParts: string[] = [];
  if (trainingCount > 0) summaryParts.push(`${trainingCount} אימונים`);
  if (recoveryCount > 0) summaryParts.push(`${recoveryCount} סשני התאוששות`);
  if (avgSleep > 0) summaryParts.push(`ממוצע שינה ${avgSleep.toFixed(1)} שעות`);

  insights.push({
    id: 'weekly-summary',
    type: 'info',
    icon: '📋',
    title: 'סיכום שבועי',
    message: summaryParts.length > 0
      ? summaryParts.join(' · ')
      : 'אין מספיק נתונים. התחל לתעד כדי לקבל תובנות!',
    priority: 3,
  });

  // ─── Rule 7: Recommendations ──────────────────────────────────
  const recommendations: string[] = [];
  if (maxConsecutiveHeavy >= 3) recommendations.push('שלב יום מנוחה אחרי כל 2 ימי אימון כבדים');
  if (avgSleep > 0 && avgSleep < 7) recommendations.push('נסה להגיע ל-7 שעות שינה לפחות');
  if (recoveryCount === 0 && trainingCount > 0) recommendations.push('הוסף לפחות 2 סשני התאוששות');
  if (trainingCount === 0) recommendations.push('לא נרשמו אימונים — הוסף פעילויות ללוח');
  if (recommendations.length === 0) recommendations.push('המשך כך — הנתונים נראים טוב!');

  insights.push({
    id: 'recommendations',
    type: 'tip',
    icon: '💡',
    title: 'המלצות לשבוע הבא',
    message: recommendations.join(' | '),
    priority: 4,
  });

  insights.sort((a, b) => b.priority - a.priority);
  return insights;
}
