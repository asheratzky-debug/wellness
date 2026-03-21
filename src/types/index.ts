export interface ActivityType {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex color
  category: 'training' | 'recovery' | 'health' | 'other';
  isCustom: boolean;
}

export interface Activity {
  id: string;
  weekId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  typeId: string;
  startTime?: string; // HH:mm, optional
  endTime?: string;   // HH:mm, optional
  count?: number;     // how many times (replaces time when no time set)
  order?: number;     // sort order within the day
  status: 'planned' | 'completed' | 'cancelled';
  notes: string;
  rpe?: number; // 1-10
}

export interface DailyHealth {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  sleepHours?: number;
  fatigueLevel?: number; // 1-10
  painLevel?: number; // 1-10
  muscleSoreness?: number; // 1-10
  mood?: number; // 1-10
  readiness?: number; // 1-10
  trainingMinutes?: number;
  rpe?: number; // 1-10
  injuryNotes?: string;
}

export type DayLoad = 'light' | 'medium' | 'heavy' | null;

export interface WeekData {
  id: string; // format: YYYY-Www (e.g., 2025-W07)
  startDate: string; // YYYY-MM-DD (Sunday)
  endDate: string; // YYYY-MM-DD (Saturday)
  dayLabels: DayLoad[]; // 7 items, index 0 = Sunday
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  icon: string;
  title: string;
  message: string;
  priority: number; // higher = more important
}

export interface WeeklySummary {
  totalTrainingSessions: number;
  totalRecoverySessions: number;
  saunaSessions: number;
  iceBathSessions: number;
  gymSessions: number;
  totalActivityHours: number;
  totalRecoveryHours: number;
  completionRate: number; // percentage
  cancelledCount: number;
  completedCount: number;
  plannedCount: number;
}
