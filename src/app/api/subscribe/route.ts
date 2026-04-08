import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { endpoint, keys, sleepHour } = await req.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      sleepHour?: number | null;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const row: Record<string, unknown> = { endpoint, p256dh: keys.p256dh, auth: keys.auth };
    if (sleepHour !== undefined) row.sleep_reminder_hour = sleepHour;

    // Upsert — same endpoint = update keys + sleep hour
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'endpoint' });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[subscribe]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
