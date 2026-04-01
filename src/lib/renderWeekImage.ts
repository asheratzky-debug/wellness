import type { Activity, ActivityType, WeekData } from '@/types';
import { DAY_NAMES } from '@/lib/constants';

interface RenderInput {
  activities: Activity[];
  activityTypes: ActivityType[];
  weekData: WeekData | null;
  userName: string;
  avatarUrl: string | null;
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatDate(startDate: string, offset: number): string {
  const d = new Date(startDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderWeekToBlob(input: RenderInput): Promise<Blob> {
  const { activities, activityTypes, weekData, userName, avatarUrl } = input;
  const typeMap = new Map(activityTypes.map((t) => [t.id, t]));

  const SCALE   = 2;
  const W       = 1120;
  const PAD     = 40;
  const GAP     = 10;
  const COL_W   = (W - PAD * 2 - GAP * 6) / 7; // ≈ 134px
  const HDR_H   = 88;   // top header
  const DAY_H   = 64;   // day column header
  const ACT_H   = 36;   // per activity row
  const ACT_PAD = 10;   // padding top/bottom inside column body

  // Max activities in any day → determines card height
  const maxActs = Math.max(1, ...Array.from({ length: 7 }, (_, i) =>
    activities.filter((a) => a.dayOfWeek === i).length,
  ));
  const GRID_H  = DAY_H + ACT_PAD + maxActs * ACT_H + ACT_PAD;
  const H       = PAD + HDR_H + 20 + GRID_H + 20 + 32 + PAD; // footer 32px

  const canvas  = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx     = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // ── Background ───────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#f0fdf4');
  bg.addColorStop(0.5, '#ffffff');
  bg.addColorStop(1,   '#f0fdf4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Header ───────────────────────────────────────────────────────────────
  const hY = PAD;

  // Green circle logo
  const logoGrad = ctx.createLinearGradient(hY, hY, hY + 44, hY + 44);
  logoGrad.addColorStop(0, '#22c55e');
  logoGrad.addColorStop(1, '#16a34a');
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  ctx.arc(hY + 22, hY + 22, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.font      = '22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('💪', hY + 22, hY + 30);

  // "Wellness" text
  ctx.fillStyle  = '#15803d';
  ctx.font       = 'bold 26px Arial';
  ctx.textAlign  = 'left';
  ctx.fillText('Wellness', hY + 54, hY + 24);
  ctx.fillStyle  = '#9ca3af';
  ctx.font       = '13px Arial';
  ctx.fillText('לוח שבועי', hY + 56, hY + 44);

  // Dates (right side)
  const dateStr = weekData
    ? `${formatDate(weekData.startDate, 0)} – ${formatDate(weekData.startDate, 6)}`
    : '';
  ctx.fillStyle  = '#6b7280';
  ctx.font       = '13px Arial';
  ctx.textAlign  = 'right';
  ctx.fillText(dateStr, W - PAD - (avatarUrl ? 70 : 0), hY + 44);

  // User name
  ctx.fillStyle  = '#111827';
  ctx.font       = 'bold 17px Arial';
  ctx.textAlign  = 'right';
  ctx.fillText(userName, W - PAD - (avatarUrl ? 70 : 0), hY + 24);

  // Avatar
  if (avatarUrl) {
    const img = new Image();
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.onerror = () => res();
      img.src = avatarUrl;
    });
    const aX = W - PAD - 52;
    const aY = hY;
    const aR = 26;
    ctx.save();
    ctx.beginPath();
    ctx.arc(aX + aR, aY + aR, aR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, aX, aY, 52, 52);
    ctx.restore();
    // Green ring
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(aX + aR, aY + aR, aR + 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── Columns ──────────────────────────────────────────────────────────────
  const gridTop = PAD + HDR_H + 20;

  for (let i = 0; i < 7; i++) {
    const colX = PAD + i * (COL_W + GAP);

    const label  = weekData?.dayLabels[i] ?? null;
    const hdrBg  = label ? LOAD_COLOR[label] : '#22c55e';
    const dateLabel = weekData ? formatDate(weekData.startDate, i) : '';

    // Card shadow (approximate with offset rect)
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    roundRect(ctx, colX + 2, gridTop + 3, COL_W, GRID_H, 14);
    ctx.fill();

    // Card background
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, colX, gridTop, COL_W, GRID_H, 14);
    ctx.fill();

    // Day header fill
    ctx.fillStyle = hdrBg;
    ctx.beginPath();
    ctx.moveTo(colX + 14, gridTop);
    ctx.lineTo(colX + COL_W - 14, gridTop);
    ctx.quadraticCurveTo(colX + COL_W, gridTop, colX + COL_W, gridTop + 14);
    ctx.lineTo(colX + COL_W, gridTop + DAY_H);
    ctx.lineTo(colX, gridTop + DAY_H);
    ctx.lineTo(colX, gridTop + 14);
    ctx.quadraticCurveTo(colX, gridTop, colX + 14, gridTop);
    ctx.closePath();
    ctx.fill();

    // Day name
    ctx.fillStyle  = '#ffffff';
    ctx.font       = 'bold 14px Arial';
    ctx.textAlign  = 'center';
    ctx.fillText(DAY_NAMES[i], colX + COL_W / 2, gridTop + 22);

    // Date
    ctx.font       = '11px Arial';
    ctx.fillStyle  = 'rgba(255,255,255,0.9)';
    ctx.fillText(dateLabel, colX + COL_W / 2, gridTop + 38);

    // Load badge
    if (label) {
      const badge  = LOAD_LABEL[label];
      const bW     = 40;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      roundRect(ctx, colX + COL_W / 2 - bW / 2, gridTop + 43, bW, 15, 7);
      ctx.fill();
      ctx.fillStyle  = '#ffffff';
      ctx.font       = 'bold 9px Arial';
      ctx.fillText(badge, colX + COL_W / 2, gridTop + 54);
    }

    // Activities
    const dayActs = activities
      .filter((a) => a.dayOfWeek === i)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (dayActs.length === 0) {
      ctx.fillStyle  = '#d1d5db';
      ctx.font       = '18px Arial';
      ctx.textAlign  = 'center';
      ctx.fillText('–', colX + COL_W / 2, gridTop + DAY_H + ACT_PAD + ACT_H / 2 + 6);
    } else {
      dayActs.forEach((a, idx) => {
        const t = typeMap.get(a.typeId);
        if (!t) return;
        const cancelled = a.status === 'cancelled';
        const aY = gridTop + DAY_H + ACT_PAD + idx * ACT_H;
        const aX = colX + 6;
        const aW = COL_W - 12;
        const aH = ACT_H - 4;

        // Activity background
        ctx.fillStyle = cancelled ? '#f3f4f6' : hexToRgba(t.color, 0.1);
        roundRect(ctx, aX, aY, aW, aH, 8);
        ctx.fill();

        // Left accent bar
        ctx.fillStyle = cancelled ? '#d1d5db' : t.color;
        roundRect(ctx, aX, aY + 4, 3, aH - 8, 2);
        ctx.fill();

        // Emoji
        ctx.font       = '14px Arial';
        ctx.textAlign  = 'left';
        ctx.globalAlpha = cancelled ? 0.5 : 1;
        ctx.fillText(t.icon, aX + 7, aY + aH / 2 + 5);

        // Activity name — drawn RTL so Hebrew aligns correctly
        ctx.font       = `${cancelled ? 'normal' : 'bold'} 11px Arial`;
        ctx.fillStyle  = cancelled ? '#9ca3af' : '#1f2937';
        ctx.textAlign  = 'right';
        ctx.direction  = 'rtl';
        const maxW     = aW - 30;
        ctx.fillText(t.name, aX + aW - 6, aY + aH / 2 + 4, maxW);
        ctx.direction  = 'ltr';
        ctx.globalAlpha = 1;
      });
    }

    // Card border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth   = 1;
    roundRect(ctx, colX, gridTop, COL_W, GRID_H, 14);
    ctx.stroke();
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.fillStyle  = '#d1d5db';
  ctx.font       = '11px Arial';
  ctx.textAlign  = 'center';
  ctx.fillText('נוצר עם Wellness App', W / 2, gridTop + GRID_H + 28);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
