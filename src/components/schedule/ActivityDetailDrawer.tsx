'use client';

import { useState, useEffect, useRef } from 'react';
import type { Activity, ActivityType } from '@/types';
import { DAY_NAMES } from '@/lib/constants';
import { saveActivity } from '@/lib/storage';

interface Props {
  activity: Activity;
  activityType: ActivityType;
  onClose: () => void;
  onSave: (updated: Activity) => void;
  onDelete: (id: string) => void;
}

export default function ActivityDetailDrawer({ activity, activityType, onClose, onSave, onDelete }: Props) {
  const [notes, setNotes] = useState(activity.notes ?? '');
  const [count, setCount] = useState(activity.count ?? 1);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Prevent body scroll when drawer open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    const updated: Activity = { ...activity, notes, count };
    saveActivity(updated);
    onSave(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleDelete = () => {
    onDelete(activity.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto flex flex-col"
        style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 shrink-0">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${activityType.color}20` }}
          >
            {activityType.icon}
          </span>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{activityType.name}</p>
            <p className="text-xs text-gray-400">{DAY_NAMES[activity.dayOfWeek]}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">כמות</span>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-3 py-2">
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))}
                className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 transition-colors">
                −
              </button>
              <span className="w-5 text-center font-bold text-gray-800">{count}</span>
              <button type="button" onClick={() => setCount((c) => c + 1)}
                className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 transition-colors">
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הוסף הערות על הפעילות..."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-gray-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleDelete}
              className="flex-shrink-0 py-2.5 px-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
              מחק
            </button>
            <button type="button" onClick={handleSave}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm ${
                saved ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              style={!saved ? { backgroundColor: activityType.color } : {}}>
              {saved ? '✓ נשמר' : 'שמור'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
