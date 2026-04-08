import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@wellness.app'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Verify Vercel Cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error) {
    console.error('[notify] DB error', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  const payload = JSON.stringify({
    title: 'אהלן אח יקר 👋',
    body: 'סיים את השבוע ותכנן את השבוע הבא',
    url: '/summary',
  });

  const staleIds: string[] = [];
  const results = await Promise.allSettled(
    (subs ?? []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch((err) => {
        // 404/410 = subscription expired, mark for removal
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(sub.endpoint);
        }
        throw err;
      })
    )
  );

  // Clean up expired subscriptions
  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleIds);
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`[notify] sent=${sent} failed=${failed} cleaned=${staleIds.length}`);
  return NextResponse.json({ sent, failed });
}
