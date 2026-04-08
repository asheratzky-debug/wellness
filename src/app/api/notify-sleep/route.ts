import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@wellness.app'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Current hour in Israel time (UTC+3 summer / UTC+2 winter)
  const now = new Date();
  const israelHour = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })).getHours();

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('sleep_reminder_hour', israelHour);

  if (error) {
    console.error('[notify-sleep] DB error', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title: 'Wellness 😴',
    body: 'כמה שעות ישנת הלילה? לחץ לתיעוד',
    url: '/health',
  });

  const staleIds: string[] = [];
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) staleIds.push(sub.endpoint);
        throw err;
      })
    )
  );

  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleIds);
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`[notify-sleep] hour=${israelHour} sent=${sent}`);
  return NextResponse.json({ sent });
}
