import { ActivityType } from '@/types';

export const DEFAULT_ACTIVITY_TYPES: ActivityType[] = [
  { id: 'training', name: 'אימון', icon: '⚽', color: '#ef4444', category: 'training', isCustom: false },
  { id: 'match', name: 'משחק', icon: '🏟️', color: '#dc2626', category: 'training', isCustom: false },
  { id: 'gym', name: 'חדר כושר', icon: '💪', color: '#f97316', category: 'training', isCustom: false },
  { id: 'mobility', name: 'מוביליטי', icon: '🤸', color: '#a855f7', category: 'training', isCustom: false },
  { id: 'sauna', name: 'סאונה', icon: '🧖', color: '#eab308', category: 'recovery', isCustom: false },
  { id: 'ice-bath', name: 'אמבטיית קרח', icon: '🧊', color: '#06b6d4', category: 'recovery', isCustom: false },
  { id: 'stretching', name: 'מתיחות', icon: '🧘', color: '#8b5cf6', category: 'recovery', isCustom: false },
  { id: 'massage', name: 'עיסוי', icon: '💆', color: '#ec4899', category: 'recovery', isCustom: false },
  { id: 'physio', name: 'פיזיותרפיה', icon: '🏥', color: '#14b8a6', category: 'recovery', isCustom: false },
  { id: 'recovery-walk', name: 'הליכת התאוששות', icon: '🚶', color: '#22c55e', category: 'recovery', isCustom: false },
  { id: 'sleep', name: 'שינה', icon: '😴', color: '#6366f1', category: 'health', isCustom: false },
  { id: 'meal', name: 'ארוחה', icon: '🍽️', color: '#f59e0b', category: 'health', isCustom: false },
];

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const DAY_NAMES_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export const CATEGORY_LABELS: Record<string, string> = {
  training: 'אימון',
  recovery: 'התאוששות',
  health: 'בריאות',
  other: 'אחר',
};

export const STATUS_LABELS: Record<string, string> = {
  planned: 'מתוכנן',
  completed: 'בוצע',
  cancelled: 'בוטל',
};

export const LOAD_LABELS: Record<string, string> = {
  light: 'קל',
  medium: 'בינוני',
  heavy: 'עומס',
};

export const LOAD_COLORS: Record<string, string> = {
  light: '#22c55e',
  medium: '#f59e0b',
  heavy: '#ef4444',
};
