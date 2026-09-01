'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { performLogout } from '../lib/auth-logout';
import { fetchSessionAccess } from '../lib/session-access';
import {
  isSubscriptionExemptPath,
  readCachedHasAccess,
} from '../lib/subscription-service';

const POLL_MS = 5 * 60 * 1000;

/**
 * Client-side account gate:
 * - On app start / route change, verifies user, company, and subscription via API
 * - Deactivated user/company → logout
 * - Expired subscription → /plans
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
        const access = await fetchSessionAccess();
        if (cancelled) return;

        if (access.code === 'USER_INACTIVE' || access.code === 'COMPANY_INACTIVE') {
          setBlocking(true);
          const msg = encodeURIComponent(access.message || 'Access denied');
          await performLogout(`/login?msg=${msg}`);
          return;
        }

        if (!access.hasAccess) {
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
