const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

/** Format a Date as YYYY-MM-DD (UTC). */
export function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as YYYY-MM-DD (local date converted to UTC key). */
export function getTodayKey(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Week ID = YYYY-MM-DD of the Sunday that starts that week.
 */
export function getWeekId(date: Date): string {
  const y = date.getFullYear();
  const mo = date.getMonth();
  const d = date.getDate();
  const utc = new Date(Date.UTC(y, mo, d));
  utc.setUTCDate(utc.getUTCDate() - utc.getUTCDay()); // back to Sunday
  return formatDateKey(utc);
}

/** Current week ID. */
export function getCurrentWeekId(): string {
  return getWeekId(new Date());
}

/** Parse a week ID (YYYY-MM-DD of Sunday) → Date. Falls back to today's week on bad input. */
export function getWeekStartDate(weekId: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(weekId)) {
    const d = new Date(weekId + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback: start of current week
  const today = new Date();
  const utc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  utc.setUTCDate(utc.getUTCDate() - utc.getUTCDay());
  return utc;
}

/** { start: Sunday, end: Saturday } for a weekId. */
export function getWeekDateRange(weekId: string): { start: Date; end: Date } {
  const start = getWeekStartDate(weekId);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 6);
  return { start, end };
}

/** Hebrew date-range label. */
export function formatHebrewDateRange(start: Date, end: Date): string {
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startYear !== endYear) {
    return `${startDay} ${HEBREW_MONTHS[startMonth]} ${startYear} - ${endDay} ${HEBREW_MONTHS[endMonth]} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${HEBREW_MONTHS[startMonth]} - ${endDay} ${HEBREW_MONTHS[endMonth]} ${endYear}`;
  }
  return `${startDay}-${endDay} ${HEBREW_MONTHS[startMonth]} ${startYear}`;
}

/** Shift weekId by ±N weeks. */
export function getAdjacentWeekId(weekId: string, direction: number): string {
  const start = getWeekStartDate(weekId);
  const shifted = new Date(start.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + direction * 7);
  return getWeekId(shifted);
}

/** Returns true if the given Date (UTC) is today (local). */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getFullYear() &&
    date.getUTCMonth() === today.getMonth() &&
    date.getUTCDate() === today.getDate()
  );
}
