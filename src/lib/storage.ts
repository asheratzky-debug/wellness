import type { Activity, DailyHealth, ActivityType, WeekData, Goal, UserProfile } from '@/types';
import { DEFAULT_ACTIVITY_TYPES } from '@/lib/constants';

const KEYS = {
  activities: 'wellness-activities',
  health: 'wellness-health',
  activityTypes: 'wellness-activity-types',
  weeks: 'wellness-weeks',
  goals: 'wellness-goals',
  profile: 'wellness-profile',
  avatar: 'wellness-avatar',
} as const;

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`[storage] Failed to write key "${key}"`);
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Validators ──────────────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isValidStatus(v: unknown): v is Activity['status'] {
  return v === 'planned' || v === 'completed' || v === 'cancelled';
}

function isValidCategory(v: unknown): v is ActivityType['category'] {
  return v === 'training' || v === 'recovery' || v === 'health' || v === 'other';
}

function isValidHexColor(v: unknown): v is string {
  return isString(v) && /^#[0-9a-fA-F]{3,8}$/.test(v);
}

function isValidDateKey(v: unknown): v is string {
  return isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function validateActivity(raw: unknown): Activity | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (!isString(a.id) || !isString(a.weekId) || !isString(a.typeId)) return null;
  if (typeof a.dayOfWeek !== 'number' || a.dayOfWeek < 0 || a.dayOfWeek > 6) return null;
  if (!isValidStatus(a.status)) return null;
  return {
    id: a.id,
    weekId: a.weekId,
    dayOfWeek: a.dayOfWeek,
    typeId: a.typeId,
    startTime: isString(a.startTime) ? a.startTime : undefined,
    endTime: isString(a.endTime) ? a.endTime : undefined,
    count: typeof a.count === 'number' && a.count > 0 ? Math.round(a.count) : undefined,
    order: typeof a.order === 'number' ? a.order : undefined,
    status: a.status,
    notes: isString(a.notes) ? a.notes : '',
    rpe: typeof a.rpe === 'number' && a.rpe >= 1 && a.rpe <= 10 ? a.rpe : undefined,
  };
}

function validateHealthData(raw: unknown): DailyHealth | null {
  if (!raw || typeof raw !== 'object') return null;
  const h = raw as Record<string, unknown>;
  if (!isString(h.id) || !isValidDateKey(h.date)) return null;

  function clamp(v: unknown, min: number, max: number): number | undefined {
    if (typeof v !== 'number' || isNaN(v)) return undefined;
    return Math.min(max, Math.max(min, v));
  }

  return {
    id: h.id,
    date: h.date,
    weight: clamp(h.weight, 20, 300),
    sleepHours: clamp(h.sleepHours, 0, 24),
    fatigueLevel: clamp(h.fatigueLevel, 1, 10),
    painLevel: clamp(h.painLevel, 1, 10),
    muscleSoreness: clamp(h.muscleSoreness, 1, 10),
    mood: clamp(h.mood, 1, 10),
    readiness: clamp(h.readiness, 1, 10),
    trainingMinutes: clamp(h.trainingMinutes, 0, 1440),
    rpe: clamp(h.rpe, 1, 10),
    injuryNotes: isString(h.injuryNotes) ? h.injuryNotes.slice(0, 1000) : undefined,
  };
}

function validateActivityType(raw: unknown): ActivityType | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  if (!isString(t.id) || !isString(t.name) || !t.name.trim()) return null;
  if (!isString(t.icon)) return null;
  if (!isValidHexColor(t.color)) return null;
  if (!isValidCategory(t.category)) return null;
  return {
    id: t.id,
    name: t.name.trim().slice(0, 50),
    icon: t.icon.slice(0, 10),
    color: t.color,
    category: t.category,
    isCustom: Boolean(t.isCustom),
  };
}

function validateWeekData(raw: unknown): WeekData | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  if (!isString(w.id) || !isValidDateKey(w.startDate) || !isValidDateKey(w.endDate)) return null;
  const validLoads = [null, 'light', 'medium', 'heavy'];
  const dayLabels = Array.isArray(w.dayLabels)
    ? w.dayLabels.slice(0, 7).map((l) => (validLoads.includes(l) ? l : null))
    : [null, null, null, null, null, null, null];
  while (dayLabels.length < 7) dayLabels.push(null);
  return {
    id: w.id,
    startDate: w.startDate,
    endDate: w.endDate,
    dayLabels: dayLabels as WeekData['dayLabels'],
  };
}

// ─── Activities ───────────────────────────────────────────────────────────────

export function getActivities(weekId?: string): Activity[] {
  const all = read<unknown[]>(KEYS.activities, []);
  const validated = all.map(validateActivity).filter((a): a is Activity => a !== null);
  if (weekId === undefined) return validated;
  return validated.filter((a) => a.weekId === weekId);
}

export function saveActivity(activity: Activity): void {
  const all = read<unknown[]>(KEYS.activities, []);
  const validated = all.map(validateActivity).filter((a): a is Activity => a !== null);
  const idx = validated.findIndex((a) => a.id === activity.id);
  if (idx >= 0) validated[idx] = activity;
  else validated.push(activity);
  write(KEYS.activities, validated);
}

export function deleteActivity(id: string): void {
  const all = read<unknown[]>(KEYS.activities, []);
  const validated = all.map(validateActivity).filter((a): a is Activity => a !== null);
  write(KEYS.activities, validated.filter((a) => a.id !== id));
}

// ─── Health data ──────────────────────────────────────────────────────────────

export function getHealthData(): DailyHealth[];
export function getHealthData(date: string): DailyHealth | undefined;
export function getHealthData(date?: string): DailyHealth[] | DailyHealth | undefined {
  const all = read<unknown[]>(KEYS.health, []);
  const validated = all.map(validateHealthData).filter((h): h is DailyHealth => h !== null);
  if (date === undefined) return validated;
  return validated.find((h) => h.date === date);
}

export function saveHealthData(data: DailyHealth): void {
  const all = read<unknown[]>(KEYS.health, []);
  const validated = all.map(validateHealthData).filter((h): h is DailyHealth => h !== null);
  let idx = validated.findIndex((h) => h.id === data.id);
  if (idx < 0) idx = validated.findIndex((h) => h.date === data.date);
  if (idx >= 0) validated[idx] = data;
  else validated.push(data);
  write(KEYS.health, validated);
}

// ─── Activity types ───────────────────────────────────────────────────────────

export function getActivityTypes(): ActivityType[] {
  const stored = read<unknown[]>(KEYS.activityTypes, []);
  const validated = stored.map(validateActivityType).filter((t): t is ActivityType => t !== null);
  const storedIds = new Set(validated.map((t) => t.id));
  const remaining = DEFAULT_ACTIVITY_TYPES.filter((d) => !storedIds.has(d.id));
  return [...remaining, ...validated];
}

export function saveActivityType(type: ActivityType): void {
  const stored = read<unknown[]>(KEYS.activityTypes, []);
  const validated = stored.map(validateActivityType).filter((t): t is ActivityType => t !== null);
  const idx = validated.findIndex((t) => t.id === type.id);
  if (idx >= 0) validated[idx] = type;
  else validated.push(type);
  write(KEYS.activityTypes, validated);
}

export function deleteActivityType(id: string): void {
  const stored = read<unknown[]>(KEYS.activityTypes, []);
  const validated = stored.map(validateActivityType).filter((t): t is ActivityType => t !== null);
  write(KEYS.activityTypes, validated.filter((t) => t.id !== id));
}

// ─── Weeks ────────────────────────────────────────────────────────────────────

export function getWeek(weekId: string): WeekData | null {
  const all = read<unknown[]>(KEYS.weeks, []);
  const validated = all.map(validateWeekData).filter((w): w is WeekData => w !== null);
  return validated.find((w) => w.id === weekId) ?? null;
}

export function saveWeek(week: WeekData): void {
  const all = read<unknown[]>(KEYS.weeks, []);
  const validated = all.map(validateWeekData).filter((w): w is WeekData => w !== null);
  const idx = validated.findIndex((w) => w.id === week.id);
  if (idx >= 0) validated[idx] = week;
  else validated.push(week);
  write(KEYS.weeks, validated);
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function getGoals(): Goal[] {
  const all = read<unknown[]>(KEYS.goals, []);
  return all.filter((g): g is Goal => {
    if (!g || typeof g !== 'object') return false;
    const obj = g as Record<string, unknown>;
    return typeof obj.id === 'string' && typeof obj.typeId === 'string' && typeof obj.targetCount === 'number';
  });
}

export function saveGoal(goal: Goal): void {
  const all = getGoals();
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) all[idx] = goal;
  else all.push(goal);
  write(KEYS.goals, all);
}

export function deleteGoal(id: string): void {
  write(KEYS.goals, getGoals().filter((g) => g.id !== id));
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  const raw = read<unknown>(KEYS.profile, null);
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.firstName !== 'string' || !p.firstName.trim()) return null;
  if (typeof p.lastName !== 'string' || !p.lastName.trim()) return null;
  const validGenders = ['male', 'female', 'other'];
  return {
    firstName: p.firstName.trim().slice(0, 30),
    lastName: p.lastName.trim().slice(0, 30),
    age: typeof p.age === 'number' && p.age > 0 && p.age < 120 ? Math.round(p.age) : undefined,
    gender: validGenders.includes(p.gender as string) ? p.gender as UserProfile['gender'] : undefined,
    isPro: Boolean(p.isPro),
    sport: typeof p.sport === 'string' ? p.sport.trim().slice(0, 30) : undefined,
    team: typeof p.team === 'string' ? p.team.trim().slice(0, 40) : undefined,
  };
}

export function saveProfile(profile: UserProfile): void {
  write(KEYS.profile, profile);
}

export function getAvatar(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(KEYS.avatar);
}

export function saveAvatar(base64: string): void {
  if (!isStorageAvailable()) return;
  try { localStorage.setItem(KEYS.avatar, base64); } catch { /* storage full */ }
}

export function deleteAvatar(): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(KEYS.avatar);
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export function exportAllData(): string {
  return JSON.stringify({
    activities: getActivities(),
    health: getHealthData(),
    activityTypes: read<unknown[]>(KEYS.activityTypes, []),
    weeks: read<unknown[]>(KEYS.weeks, []),
    exportedAt: new Date().toISOString(),
    version: 1,
  }, null, 2);
}

export function importAllData(json: string): boolean {
  if (!isStorageAvailable()) return false;
  if (json.length > 5_000_000) return false; // 5MB hard limit
  try {
    const data = JSON.parse(json) as Record<string, unknown>;

    // Require arrays for all keys
    if (!Array.isArray(data.activities) || !Array.isArray(data.health) ||
        !Array.isArray(data.activityTypes) || !Array.isArray(data.weeks)) return false;

    // Validate each item before writing — drop invalid records
    const activities = data.activities.map(validateActivity).filter((a): a is Activity => a !== null);
    const health = data.health.map(validateHealthData).filter((h): h is DailyHealth => h !== null);
    const activityTypes = data.activityTypes.map(validateActivityType).filter((t): t is ActivityType => t !== null);
    const weeks = data.weeks.map(validateWeekData).filter((w): w is WeekData => w !== null);

    write(KEYS.activities, activities);
    write(KEYS.health, health);
    write(KEYS.activityTypes, activityTypes);
    write(KEYS.weeks, weeks);
    return true;
  } catch {
    return false;
  }
}
