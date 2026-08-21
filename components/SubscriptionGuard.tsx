'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  fetchSubscriptionStatus,
  isSubscriptionExemptPath,
  readCachedHasAccess,
} from '../lib/subscription-service';

const POLL_MS = 5 * 60 * 1000;

/**
 * Client-side subscription gate:
 * - On app start / route change, verifies access via API
 * - Redirects expired users to /plans
 * - Polls every 5 minutes while inside the app
 */
export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [blocking, setBlocking] = useState(false);
  const checking = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const runCheck = async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setBlocking(false);
        return;
      }

      if (isSubscriptionExemptPath(pathname || '')) {
        setBlocking(false);
        return;
      }

      const cached = readCachedHasAccess();
      if (cached === false) {
        setBlocking(true);
        router.replace('/plans');
      }

      if (checking.current) return;
      checking.current = true;
      try {
        const snapshot = await fetchSubscriptionStatus();
        if (cancelled) return;
        if (!snapshot.hasAccess) {
          setBlocking(true);
          router.replace('/plans');
        } else {
          setBlocking(false);
        }
      } catch {
        // Network blip — keep current page; API 403 still protects
      } finally {
        checking.current = false;
      }
    };

    runCheck();
    timer = setInterval(runCheck, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [pathname, router]);

  if (blocking && !isSubscriptionExemptPath(pathname || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1088dd] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
