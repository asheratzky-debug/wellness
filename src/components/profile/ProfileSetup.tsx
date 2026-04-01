'use client';

import { useState, useRef } from 'react';
import { saveProfile, getAvatar, saveAvatar, deleteAvatar } from '@/lib/storage';
import type { UserProfile } from '@/types';

interface Props {
  existing?: UserProfile | null;
  onDone: (profile: UserProfile, avatar: string | null) => void;
}

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; emoji?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 mb-1.5">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === o.value
                ? 'border-green-400 bg-green-50 text-green-700'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}
          >
            {o.emoji && <span className="mr-1">{o.emoji}</span>}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProfileSetup({ existing, onDone }: Props) {
  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName,  setLastName]  = useState(existing?.lastName  ?? '');
  const [age,       setAge]       = useState<string>(existing?.age?.toString() ?? '');
  const [gender,    setGender]    = useState<UserProfile['gender']>(existing?.gender);
  const [isPro,     setIsPro]     = useState<boolean | undefined>(existing ? existing.isPro : undefined);
  const [sport,     setSport]     = useState(existing?.sport ?? '');
  const [team,      setTeam]      = useState(existing?.team  ?? '');
  const [avatar,    setAvatar]    = useState<string | null>(() => getAvatar());

  const fileRef = useRef<HTMLInputElement>(null);
  const isNew   = !existing;
  const canSave = firstName.trim() && lastName.trim() && isPro !== undefined;

  const initials = (firstName[0] ?? '') + (lastName[0] ?? '');

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      age:       age ? Math.min(120, Math.max(1, parseInt(age))) : undefined,
      gender,
      isPro:     isPro!,
      sport:     isPro && sport.trim() ? sport.trim() : undefined,
      team:      isPro && team.trim()  ? team.trim()  : undefined,
    };
    saveProfile(profile);
    if (avatar) saveAvatar(avatar);
    else deleteAvatar();
    onDone(profile, avatar);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center px-5 overflow-y-auto py-8">
      {/* Logo */}
      <div className="text-center mb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Wellness</h1>
        <p className="text-green-200 text-sm mt-1">
          {isNew ? 'ברוך הבא! בואו נתחיל' : 'עדכון פרטים אישיים'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5">

        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-green-100 border-4 border-white shadow-md hover:opacity-90 transition-opacity"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-green-600 select-none">
                {initials || '👤'}
              </span>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/30 text-white text-[9px] text-center py-0.5">
              שנה
            </div>
          </button>
          {avatar && (
            <button type="button" onClick={() => setAvatar(null)} className="text-[11px] text-red-400">
              הסר תמונה
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">שם פרטי *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="אריאל" maxLength={30} required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">שם משפחה *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
              placeholder="שרצקי" maxLength={30} required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50" />
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">גיל</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
            placeholder="25" min={1} max={120}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50" />
        </div>

        {/* Gender */}
        <ToggleGroup label="מין" value={gender} onChange={setGender}
          options={[
            { value: 'male',   label: 'זכר',  emoji: '👨' },
            { value: 'female', label: 'נקבה', emoji: '👩' },
            { value: 'other',  label: 'אחר'              },
          ]} />

        <div className="border-t border-gray-100" />

        {/* Pro */}
        <ToggleGroup label="ספורטאי מקצועי? *"
          value={isPro === undefined ? undefined : isPro ? 'yes' : 'no'}
          onChange={(v) => setIsPro(v === 'yes')}
          options={[{ value: 'yes', label: 'כן 🏅' }, { value: 'no', label: 'לא' }]} />

        {isPro === true && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">ענף ספורט</label>
              <input type="text" value={sport} onChange={(e) => setSport(e.target.value)}
                placeholder="כדורגל, כדורסל, אגרוף..." maxLength={30}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">קבוצה / מועדון</label>
              <input type="text" value={team} onChange={(e) => setTeam(e.target.value)}
                placeholder="מכבי תל אביב" maxLength={40}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 bg-gray-50" />
            </div>
          </div>
        )}

        <button type="submit" disabled={!canSave}
          className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm">
          {isNew ? 'בואו נתחיל 🚀' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
}
