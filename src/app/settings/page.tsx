'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getActivityTypes,
  saveActivityType,
  deleteActivityType,
  exportAllData,
  importAllData,
  generateId,
} from '@/lib/storage';
import { subscribeToPushNotifications, isPushSubscribed } from '@/lib/notifications';
import { DEFAULT_ACTIVITY_TYPES } from '@/lib/constants';
import type { ActivityType } from '@/types';

const CATEGORY_OPTIONS = [
  { value: 'training', label: 'אימון' },
  { value: 'recovery', label: 'התאוששות' },
  { value: 'health', label: 'בריאות' },
  { value: 'other', label: 'אחר' },
];

const PRESET_ICONS = [
  '⚽','🏟️','💪','🤸','🧖','🧊','🧘','💆','🏥','🚶','😴','🍽️',
  '🏃','🚴','🏊','🧗','🥊','🏋️','🤾','🏄','⛹️','🏌️','🎾','🏸',
  '🥅','🎯','🛹','🪂','☀️','🌊','❄️','🔥','⛰️','🌿','🧠','💨',
  '🦵','🦶','🤽','🚣','🏇','🤼','🥋','🎽','🩹','💉','🩺','🛁',
  '🧴','🥗','🥤','💊','🍌','🥩','🫀','🌬️','🧲','⚡','🏕️','🌅',
];
const PRESET_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#84cc16','#6366f1'];

const defaultIds = new Set(DEFAULT_ACTIVITY_TYPES.map((t) => t.id));

type EditState = Omit<ActivityType, 'isCustom'>;

export default function SettingsPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [pushEnabled, setPushEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => setTypes(getActivityTypes());

  useEffect(() => {
    reload();
    setPushEnabled(isPushSubscribed());
  }, []);

  const handleEnablePush = async () => {
    setPushStatus('loading');
    const ok = await subscribeToPushNotifications();
    setPushStatus(ok ? 'done' : 'denied');
    setPushEnabled(ok);
    setTimeout(() => setPushStatus('idle'), 3000);
  };

  const openNew = () => {
    setEditing({ id: generateId(), name: '', icon: '🏃', color: '#22c55e', category: 'training' });
    setIsNew(true);
  };

  const openEdit = (t: ActivityType) => {
    setEditing({ id: t.id, name: t.name, icon: t.icon, color: t.color, category: t.category });
    setIsNew(false);
  };

  const isValidHex = (c: string) => /^#[0-9a-fA-F]{3,8}$/.test(c);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    if (!isValidHex(editing.color)) return;
    saveActivityType({ ...editing, name: editing.name.trim().slice(0, 50), isCustom: !defaultIds.has(editing.id) });
    reload();
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (defaultIds.has(id)) {
      // Reset default to original
      const original = DEFAULT_ACTIVITY_TYPES.find((t) => t.id === id);
      if (original) { saveActivityType(original); reload(); }
    } else {
      deleteActivityType(id);
      reload();
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportAllData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('הייצוא הצליח!');
    setTimeout(() => setExportStatus(''), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Guard: only accept JSON files
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportStatus('שגיאה: קובץ JSON בלבד');
      setTimeout(() => setImportStatus(''), 3000);
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5 MB limit
      setImportStatus('שגיאה: קובץ גדול מדי');
      setTimeout(() => setImportStatus(''), 3000);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result !== 'string') { setImportStatus('שגיאה בקריאת הקובץ'); return; }
      const ok = importAllData(result);
      if (ok) { setImportStatus('הייבוא הצליח!'); setTimeout(() => window.location.reload(), 1000); }
      else { setImportStatus('שגיאה: קובץ לא תקין'); setTimeout(() => setImportStatus(''), 3000); }
    };
    reader.onerror = () => { setImportStatus('שגיאה בקריאת הקובץ'); };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isEdited = (t: ActivityType) => {
    const orig = DEFAULT_ACTIVITY_TYPES.find((d) => d.id === t.id);
    if (!orig) return false;
    return orig.name !== t.name || orig.icon !== t.icon || orig.color !== t.color;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">הגדרות</h1>
      </div>

      {/* Edit / Add form (slide-in panel) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
          <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
            <button type="button" onClick={() => setEditing(null)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {isNew ? 'פעילות חדשה' : `עריכת ${editing.name}`}
            </h2>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto max-w-lg mx-auto w-full p-4 pb-28 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs text-gray-500 mb-1">שם</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs text-gray-500 mb-1">קטגוריה</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {CATEGORY_OPTIONS.map((c) => (
                  <button key={c.value} type="button"
                    onClick={() => setEditing({ ...editing, category: c.value as ActivityType['category'] })}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      editing.category === c.value ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs text-gray-500 mb-2">אייקון</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setEditing({ ...editing, icon })}
                    className={`w-10 h-10 text-xl rounded-xl transition-all ${
                      editing.icon === icon ? 'bg-green-100 ring-2 ring-green-400' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                    }`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs text-gray-500 mb-2">צבע</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setEditing({ ...editing, color })}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      editing.color === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: `${editing.color}15`, border: `1px solid ${editing.color}40` }}>
              <span className="text-3xl">{editing.icon}</span>
              <span className="font-semibold" style={{ color: editing.color }}>
                {editing.name || 'שם הפעילות'}
              </span>
            </div>

            <button type="submit"
              className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-colors shadow-sm">
              שמור
            </button>
          </form>
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* All activity types */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">סוגי פעילות</h2>
            <button type="button" onClick={openNew}
              className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
              + הוסף
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {types.map((type) => {
              const edited = isEdited(type);
              return (
                <div key={type.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${type.color}18` }}>
                    {type.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{type.name}</p>
                    <p className="text-xs text-gray-400">
                      {CATEGORY_OPTIONS.find((c) => c.value === type.category)?.label}
                      {edited && <span className="mr-1 text-orange-400">· שונה</span>}
                    </p>
                  </div>
                  <button type="button" onClick={() => openEdit(type)}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  {type.isCustom ? (
                    <button type="button" onClick={() => handleDelete(type.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : edited ? (
                    <button type="button" onClick={() => handleDelete(type.id)}
                      className="text-xs text-orange-400 hover:text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors">
                      איפוס
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Data management */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">ניהול נתונים</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-4 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">ייצוא</p>
                <p className="text-xs text-gray-400">הורד גיבוי JSON</p>
              </div>
              <button type="button" onClick={handleExport}
                className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                {exportStatus || 'ייצוא'}
              </button>
            </div>
            <div className="px-4 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">ייבוא</p>
                <p className="text-xs text-gray-400">שחזר מקובץ גיבוי</p>
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                {importStatus || 'ייבוא'}
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
          </div>
        </div>

        {/* Push notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">התראות</h2>
          </div>
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">סיכום מטרות שבועי</p>
              <p className="text-xs text-gray-400">התראת push במוצ&quot;ש ב-19:00</p>
            </div>
            {pushEnabled ? (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                ✓ פעיל
              </span>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushStatus === 'loading'}
                className="text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {pushStatus === 'loading' ? '...' : pushStatus === 'done' ? '✓ הופעל' : pushStatus === 'denied' ? 'נחסם' : 'הפעל'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">Wellness v2.0</p>
      </div>
    </div>
  );
}
