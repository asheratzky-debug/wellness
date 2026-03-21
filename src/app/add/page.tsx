'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentWeekId } from '@/lib/utils';

export default function AddPage() {
  const router = useRouter();

  useEffect(() => {
    const weekId = getCurrentWeekId();
    const today = new Date().getDay();
    router.replace(`/add-activity?weekId=${weekId}&day=${today}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">טוען...</div>
    </div>
  );
}
