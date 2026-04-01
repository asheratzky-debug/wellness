'use client';

import type { Activity, ActivityType, WeekData } from '@/types';
import { DAY_NAMES } from '@/lib/constants';

interface Props {
  activities: Activity[];
  activityTypes: ActivityType[];
  weekData: WeekData | null;
  userName: string;
  avatarUrl: string | null;
  exportRef: React.RefObject<HTMLDivElement | null>;
}

const LOAD_COLOR: Record<string, string> = {
  light: '#22c55e',
  medium: '#f59e0b',
  heavy: '#ef4444',
};
const LOAD_LABEL: Record<string, string> = {
  light: 'קל',
  medium: 'בינוני',
  heavy: 'עומס',
};

function formatDate(dateStr: string, offset: number) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export default function WeekShareCard({
  activities,
  activityTypes,
  weekData,
  userName,
  avatarUrl,
  exportRef,
}: Props) {
  const typeMap = new Map(activityTypes.map((t) => [t.id, t]));
  const startLabel = weekData ? formatDate(weekData.startDate, 0) : '';
  const endLabel   = weekData ? formatDate(weekData.startDate, 6) : '';

  // IMPORTANT: direction:ltr fixes html2canvas Hebrew text rendering.
  // Hebrew renders correctly inside LTR containers — the bug only appears
  // when the *container itself* is RTL.
  return (
    <div
      ref={exportRef}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1120px',
        direction: 'ltr',
        background: 'linear-gradient(160deg,#f0fdf4 0%,#ffffff 55%,#f0fdf4 100%)',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '36px 36px 28px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>💪</div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', letterSpacing: '-0.5px' }}>Wellness</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '1px' }}>לוח שבועי</div>
          </div>
        </div>

        {/* Right: user + dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{userName}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>{startLabel} – {endLabel}</div>
          </div>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{
              width: '52px', height: '52px', borderRadius: '50%',
              objectFit: 'cover', border: '3px solid #22c55e',
              flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0,
            }}>👤</div>
          )}
        </div>
      </div>

      {/* ── Day columns: Sunday (0) → Saturday (6) left to right ── */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {Array.from({ length: 7 }, (_, i) => {
          const dayActs = activities
            .filter((a) => a.dayOfWeek === i)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          const label   = weekData?.dayLabels[i] ?? null;
          const dateStr = weekData ? formatDate(weekData.startDate, i) : '';
          const headerBg = label ? LOAD_COLOR[label] : '#22c55e';

          return (
            <div key={i} style={{
              flex: 1,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '220px',
            }}>
              {/* Day header */}
              <div style={{
                background: headerBg,
                padding: '11px 6px 9px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', marginTop: '2px' }}>{dateStr}</div>
                {label && (
                  <div style={{
                    marginTop: '5px',
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '20px',
                    padding: '1px 9px',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                  }}>{LOAD_LABEL[label]}</div>
                )}
              </div>

              {/* Activities */}
              <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                {dayActs.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '18px' }}>–</div>
                ) : (
                  dayActs.map((a) => {
                    const t = typeMap.get(a.typeId);
                    if (!t) return null;
                    const cancelled = a.status === 'cancelled';
                    return (
                      <div key={a.id} style={{
                        background: cancelled ? '#f9fafb' : `${t.color}18`,
                        borderRadius: '9px',
                        padding: '6px 7px',
                        borderLeft: `3px solid ${cancelled ? '#d1d5db' : t.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        opacity: cancelled ? 0.55 : 1,
                      }}>
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{t.icon}</span>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            fontSize: '11px', fontWeight: 700, color: '#1f2937',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            textAlign: 'right',
                            direction: 'rtl',
                          }}>{t.name}</div>
                          {a.status === 'completed' && (
                            <div style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600, textAlign: 'right' }}>✓ בוצע</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#d1d5db', fontSize: '11px', letterSpacing: '0.3px' }}>
        נוצר עם Wellness App
      </div>
    </div>
  );
}
