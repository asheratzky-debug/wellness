'use client';

import { useState, useEffect } from 'react';
import { getHealthData, saveHealthData, generateId } from '@/lib/storage';
import { getTodayKey } from '@/lib/utils';
import { enableSleepReminder, isSleepReminderEnabled, disableSleepReminder, registerSW } from '@/lib/notifications';
import type { DailyHealth } from '@/types';

function getRecentDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
  }
  return dates;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDate();
  const months = ['ינו','פבר','מרץ','אפר','מאי','יוני','יולי','אוג','ספט','אוק','נוב','דצמ'];
  return `${day} ${months[d.getUTCMonth()]}`;
}

export default function SleepPage() {
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [saved, setSaved] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  useEffect(() => {
    registerSW();
    setReminderEnabled(isSleepReminderEnabled());
  }, []);

  const handleToggleReminder = async () => {
    setReminderLoading(true);
    if (reminderEnabled) {
      disableSleepReminder();
      setReminderEnabled(false);
    } else {
      const result = await enableSleepReminder(9, 0);
      setReminderEnabled(result === 'granted');
      if (result === 'denied') alert('יש לאפשר התראות בהגדרות האייפון');
      if (result === 'unsupported') alert('הדפדפן שלך לא תומך בהתראות');
    }
    setReminderLoading(false);
  };

  useEffect(() => {
    const data = getHealthData(selectedDate);
    setSleepHours(data?.sleepHours ?? '');
    setSaved(false);
  }, [selectedDate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = getHealthData(selectedDate);
    const entry: DailyHealth = {
      ...(existing ?? {}),
      id: existing?.id ?? generateId(),
      date: selectedDate,
      sleepHours: sleepHours !== '' ? Math.min(24, Math.max(0, Number(sleepHours))) : undefined,
    };
    saveHealthData(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const recentDates = getRecentDates();

  const sleepNum = sleepHours !== '' ? Number(sleepHours) : null;
  const sleepColor =
    sleepNum === null ? 'text-gray-400'
    : sleepNum >= 8 ? 'text-green-600'
    : sleepNum >= 7 ? 'text-yellow-500'
    : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">😴 שינה</h1>
        <p className="text-sm text-gray-400 mt-0.5">כמה שעות ישנת?</p>
      </div>

      {/* Date selector */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recentDates.map((date) => {
            const isToday = date === todayKey;
            const isSelected = date === selectedDate;
            const hasData = !!(getHealthData(date)?.sleepHours);
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all relative ${
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {hasData && !isSelected && (
                  <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                )}
                <span>{formatDisplayDate(date)}</span>
                {isToday && <span className="text-[9px] opacity-70 mt-0.5">היום</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main input */}
      <form onSubmit={handleSave} className="max-w-sm mx-auto p-6 flex flex-col items-center gap-8 mt-4">
        <div className="flex flex-col items-center gap-3">
          <span className="text-6xl">😴</span>
          <div className="flex items-end gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="0"
              className={`w-28 text-center text-5xl font-bold border-b-2 border-gray-200 focus:border-indigo-400 focus:outline-none bg-transparent pb-1 ${sleepColor}`}
            />
            <span className="text-xl text-gray-400 pb-2">שעות</span>
          </div>

          {sleepNum !== null && (
            <p className={`text-sm font-medium ${sleepColor}`}>
              {sleepNum >= 8 ? 'שינה מצוינת 🌟'
               : sleepNum >= 7 ? 'שינה טובה 👍'
               : sleepNum >= 6 ? 'קצת מעט...'
               : 'מעט מדי שינה 😓'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={sleepHours === ''}
          className={`w-full py-3.5 rounded-2xl font-semibold text-base transition-all shadow-sm disabled:opacity-40 ${
            saved
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white'
          }`}
        >
          {saved ? '✓ נשמר!' : 'שמור'}
        </button>

        {/* Daily reminder toggle */}
        <button
          type="button"
          onClick={handleToggleReminder}
          disabled={reminderLoading}
          className={`w-full py-3 rounded-2xl font-medium text-sm transition-all border ${
            reminderEnabled
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {reminderLoading ? '...' : reminderEnabled ? '🔔 תזכורת שינה פעילה — 09:00' : '🔔 הפעל תזכורת יומית ב-09:00'}
        </button>
      </form>
    </div>
  );
}
