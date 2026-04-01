'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActivities, getActivityTypes, getHealthData, getGoals, deleteGoal } from '@/lib/storage';
import { getCurrentWeekId, getTodayKey } from '@/lib/utils';
import { DAY_NAMES } from '@/lib/constants';
import type { Activity, ActivityType, Goal } from '@/types';
import GoalsSection from '@/components/goals/GoalsSection';
import { getTodayCard } from '@/lib/dailyCard';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

interface GoalWithProgress extends Goal {
  current: number;
  activityType: ActivityType;
}

function GoalsReviewModal({
  goals,
  onDone,
}: {
  goals: GoalWithProgress[];
  onDone: (removedIds: string[]) => void;
}) {
  const [toRemove, setToRemove] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setToRemove((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 space-y-4">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1" />

        <div className="text-center">
          <p className="text-2xl mb-1">🎯</p>
          <p className="text-base font-bold text-gray-800">סיכום מטרות שבועיות</p>
          <p className="text-xs text-gray-400 mt-0.5">סמן מטרות שתרצה להסיר לשבוע הבא</p>
        </div>

        <div className="space-y-3">
          {goals.map((g) => {
            const done = g.current >= g.targetCount;
            const removing = toRemove.has(g.id);
            return (
              <div
                key={g.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                  removing
                    ? 'border-red-200 bg-red-50 opacity-60'
                    : done
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${g.activityType.color}20` }}
                >
                  {g.activityType.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{g.activityType.name}</p>
                  <p className={`text-xs font-medium mt-0.5 ${done ? 'text-green-600' : 'text-red-400'}`}>
                    {done ? `✅ הושג! ${g.current}/${g.targetCount}` : `❌ לא הושג ${g.current}/${g.targetCount}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    removing
                      ? 'bg-red-100 border-red-300 text-red-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  {removing ? 'מסיר ✓' : 'הסר'}
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onDone([...toRemove])}
          className="w-full py-3 rounded-2xl bg-green-500 text-white text-sm font-bold shadow-sm"
        >
          {toRemove.size > 0
            ? `המשך לשבוע הבא (הסר ${toRemove.size})`
            : 'המשך לשבוע הבא ✓'}
        </button>
      </div>
    </div>
  );
}

function shouldShowSleepBanner(sleepHours: number | undefined): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('sleepReminderEnabled') !== 'true') return false;
  if (new Date().getHours() < 9) return false;
  if (sleepHours !== undefined) return false;
  const dismissed = localStorage.getItem('sleepReminderDismissed');
  if (dismissed === getTodayKey()) return false;
  return true;
}

function shouldShowGoalsReview(weekId: string): boolean {
  if (typeof window === 'undefined') return false;
  const now = new Date();
  if (now.getDay() !== 6) return false; // only Saturday
  if (now.getHours() < 19) return false; // only after 19:00
  const reviewed = localStorage.getItem('goalsReviewed');
  if (reviewed === weekId) return false; // already reviewed this week
  return true;
}

export default function HomePage() {
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<Map<string, ActivityType>>(new Map());
  const [activityTypesList, setActivityTypesList] = useState<ActivityType[]>([]);
  const [sleepHours, setSleepHours] = useState<number | undefined>(undefined);
  const [weekStats, setWeekStats] = useState({ total: 0, training: 0, recovery: 0 });
  const [goalsWithProgress, setGoalsWithProgress] = useState<GoalWithProgress[]>([]);
  const [showSleepBanner, setShowSleepBanner] = useState(false);
  const [showGoalsReview, setShowGoalsReview] = useState(false);

  const loadData = () => {
    const weekId = getCurrentWeekId();
    const todayKey = getTodayKey();
    const today = new Date().getDay();

    const allActivities = getActivities(weekId);
    const types = getActivityTypes();
    const typeMap = new Map(types.map((t) => [t.id, t]));

    setTodayActivities(allActivities.filter((a) => a.dayOfWeek === today));
    setActivityTypes(typeMap);
    setActivityTypesList(types);
    const sleep = getHealthData(todayKey)?.sleepHours;
    setSleepHours(sleep);
    setShowSleepBanner(shouldShowSleepBanner(sleep));

    setWeekStats({
      total: allActivities.length,
      training: allActivities.filter((a) => typeMap.get(a.typeId)?.category === 'training').length,
      recovery: allActivities.filter((a) => typeMap.get(a.typeId)?.category === 'recovery').length,
    });

    const goals = getGoals();
    const withProgress: GoalWithProgress[] = goals.flatMap((g) => {
      const actType = typeMap.get(g.typeId);
      if (!actType) return [];
      const current = allActivities.filter((a) => a.typeId === g.typeId && a.status !== 'cancelled').length;
      return [{ ...g, current, activityType: actType }];
    });
    setGoalsWithProgress(withProgress);
    setShowGoalsReview(shouldShowGoalsReview(weekId));
  };

  useEffect(() => { loadData(); }, []);

  const todayName = DAY_NAMES[new Date().getDay()];
  const dailyCard = getTodayCard();

  const dismissSleepBanner = () => {
    localStorage.setItem('sleepReminderDismissed', getTodayKey());
    setShowSleepBanner(false);
  };

  const handleGoalsReviewDone = (removedIds: string[]) => {
    removedIds.forEach(deleteGoal);
    localStorage.setItem('goalsReviewed', getCurrentWeekId());
    setShowGoalsReview(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Weekly goals review modal */}
      {showGoalsReview && goalsWithProgress.length > 0 && (
        <GoalsReviewModal goals={goalsWithProgress} onDone={handleGoalsReviewDone} />
      )}

      {/* Sleep reminder banner */}
      {showSleepBanner && (
        <Link
          href="/health"
          className="flex items-center gap-3 bg-indigo-500 px-4 py-3 text-white"
          onClick={dismissSleepBanner}
        >
          <span className="text-xl">😴</span>
          <p className="flex-1 text-sm font-medium">עוד לא תיעדת שינה היום</p>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); dismissSleepBanner(); }}
            className="text-indigo-200 hover:text-white text-lg leading-none px-1"
          >
            ×
          </button>
        </Link>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-700 px-5 pt-6 pb-8 text-white">
        <p className="text-green-100 text-sm">{getGreeting()} 👋</p>
        <h1 className="text-2xl font-bold mt-1">Wellness</h1>
        <p className="text-green-200 text-sm mt-0.5">יום {todayName}</p>
      </div>

      {/* Quick stats card */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-md border border-gray-100 p-4">
        <p className="text-xs text-gray-500 font-medium mb-3">סיכום שבועי</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{weekStats.total}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">פעילויות</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{weekStats.training}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">אימונים</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-500">{weekStats.recovery}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">התאוששות</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Daily card */}
        <div className="rounded-2xl border border-green-100 shadow-md px-4 py-3 flex gap-3 items-start"
          style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)' }}>
          <span className="text-2xl shrink-0 mt-0.5">{dailyCard.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
              {dailyCard.type === 'joke' ? 'לצחוק קצת' : dailyCard.type === 'story' ? 'סיפור השראה' : dailyCard.type === 'quote' ? 'ציטוט' : 'מחשבה ליום'}
            </p>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">{dailyCard.text}</p>
            {dailyCard.author && (
              <p className="text-[11px] text-gray-400 mt-1">— {dailyCard.author}</p>
            )}
          </div>
          <div className="w-1 self-stretch rounded-full bg-green-400 shrink-0 opacity-60" />
        </div>

        {/* Sleep */}
        {sleepHours !== undefined ? (
          <Link href="/health" className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <span className="text-3xl">😴</span>
            <div>
              <p className="text-sm text-indigo-400">שינה הלילה</p>
              <p className="text-2xl font-bold text-indigo-700">{sleepHours} שעות</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/health"
            className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <span className="text-2xl">😴</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800">כמה ישנת הלילה?</p>
              <p className="text-xs text-indigo-400">לחץ לתיעוד שינה</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        )}

        {/* Today's activities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">פעילויות היום</p>
            <Link href="/schedule" className="text-xs text-green-600 font-medium">
              כל השבוע ←
            </Link>
          </div>

          {todayActivities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
              <span className="text-3xl block mb-2">📅</span>
              <p className="text-sm text-gray-500">אין פעילויות להיום</p>
              <Link
                href={`/add-activity?weekId=${getCurrentWeekId()}&day=${new Date().getDay()}`}
                className="inline-block mt-3 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors"
              >
                + הוסף פעילות
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todayActivities.map((activity) => {
                const type = activityTypes.get(activity.typeId);
                if (!type) return null;
                return (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
                    style={{ borderRightWidth: 3, borderRightColor: type.color }}
                  >
                    <span className="text-xl shrink-0">{type.icon}</span>
                    <p className="text-sm font-semibold text-gray-800 flex-1">{type.name}</p>
                    {activity.count && activity.count > 1 && (
                      <span className="text-xs font-bold text-gray-400">×{activity.count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals */}
        <GoalsSection
          goals={goalsWithProgress}
          activityTypes={activityTypesList}
          onUpdate={loadData}
        />

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/schedule" className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">לוח שבועי</p>
              <p className="text-xs text-gray-400">תכנון האימונים</p>
            </div>
          </Link>
          <Link href="/insights" className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">🧠</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">תובנות</p>
              <p className="text-xs text-gray-400">ניתוח ביצועים</p>
            </div>
          </Link>
          <Link href="/summary" className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">סיכום</p>
              <p className="text-xs text-gray-400">סטטיסטיקות</p>
            </div>
          </Link>
          <Link href="/health" className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">😴</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">שינה</p>
              <p className="text-xs text-gray-400">תיעוד שעות שינה</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
