'use client';

import { useState } from 'react';
import { saveProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';

interface Props {
  existing?: UserProfile | null;
  onDone: (profile: UserProfile) => void;
}

export default function ProfileSetup({ existing, onDone }: Props) {
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [team, setTeam] = useState(existing?.team ?? '');
  const [position, setPosition] = useState(existing?.position ?? '');

  const isNew = !existing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      team: team.trim() || undefined,
      position: position.trim() || undefined,
    };
    saveProfile(profile);
    onDone(profile);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center px-6">
      {/* Logo / title */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">💪</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Wellness</h1>
        <p className="text-green-200 text-sm mt-1">
          {isNew ? 'ברוך הבא! בואו נתחיל' : 'עדכון פרטים אישיים'}
        </p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4"
      >
        <p className="text-sm font-bold text-gray-700 mb-1">הפרטים שלך</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">שם פרטי *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="אריאל"
              maxLength={30}
              required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">שם משפחה *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="שרצקי"
              maxLength={30}
              required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">קבוצה / מועדון</label>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="מכבי תל אביב (אופציונלי)"
            maxLength={40}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">עמדה / תפקיד</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="חלוץ, שוער, מאמן... (אופציונלי)"
            maxLength={30}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50"
          />
        </div>

        <button
          type="submit"
          disabled={!firstName.trim() || !lastName.trim()}
          className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm mt-2"
        >
          {isNew ? 'בואו נתחיל 🚀' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
}
