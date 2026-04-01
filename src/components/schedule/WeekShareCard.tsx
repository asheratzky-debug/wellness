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

export default function WeekShareCard({
  activities,
  activityTypes,
  weekData,
  userName,
  avatarUrl,
  exportRef,
}: Props) {
  const typeMap = new Map(activityTypes.map((t) => [t.id, t]));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  };

  const startLabel = weekData ? formatDate(weekData.startDate) : '';
  const endLabel   = weekData ? formatDate(weekData.endDate)   : '';

  return (
    // Rendered off-screen; captured by html2canvas
    <div
      ref={exportRef}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1080px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        fontFamily: "'Heebo', 'Arial', sans-serif",
        direction: 'rtl',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #22c55e' }}
            />
          )}
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534' }}>💪 Wellness</div>
            <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '2px' }}>{userName}</div>
          </div>
        </div>
        <div style={{ textAlign: 'left', color: '#6b7280', fontSize: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>לוח שבועי</div>
          <div>{startLabel} – {endLabel}</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {Array.from({ length: 7 }, (_, i) => {
          const dayActivities = activities
            .filter((a) => a.dayOfWeek === i)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          const label = weekData?.dayLabels[i];
          const dateStr = weekData
            ? (() => {
                const d = new Date(weekData.startDate + 'T00:00:00Z');
                d.setUTCDate(d.getUTCDate() + i);
                return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
              })()
            : '';

          return (
            <div
              key={i}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                border: '1px solid #e5e7eb',
                minHeight: '200px',
              }}
            >
              {/* Day header */}
              <div
                style={{
                  background: label ? LOAD_COLOR[label] : '#22c55e',
                  padding: '10px 8px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>{dateStr}</div>
                {label && (
                  <div style={{
                    marginTop: '4px',
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '8px',
                    padding: '1px 8px',
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 700,
                  }}>
                    {LOAD_LABEL[label]}
                  </div>
                )}
              </div>

              {/* Activities */}
              <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: '11px', paddingTop: '12px' }}>—</div>
                ) : (
                  dayActivities.map((a) => {
                    const t = typeMap.get(a.typeId);
                    if (!t) return null;
                    return (
                      <div
                        key={a.id}
                        style={{
                          background: `${t.color}14`,
                          borderRadius: '10px',
                          padding: '6px 8px',
                          borderRight: `3px solid ${t.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{t.icon}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.name}
                          </div>
                          {a.status === 'completed' && (
                            <div style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600 }}>✓ בוצע</div>
                          )}
                          {a.status === 'cancelled' && (
                            <div style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600 }}>✗ בוטל</div>
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

      {/* Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
        נוצר עם Wellness App
      </div>
    </div>
  );
}
