'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { performLogout } from '../lib/auth-logout';
import { fetchSessionAccess } from '../lib/session-access';
import {
  fetchSubscriptionCapacity,
  isErpOnlyPath,
  isPosOnlyTier,
  isSubscriptionExemptPath,
  readCachedHasAccess,
  readCachedProductTier,
  readCachedSubscription,
} from '../lib/subscription-service';

const POLL_MS = 20 * 1000;

function AccessDeniedDialog({
  title,
  message,
  onConfirm,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#014582' }}
        >
          OK, sign out
        </button>
      </div>
    </div>
  );
}

function titleFor(code?: string) {
  if (code === 'USER_INACTIVE') return 'Account deactivated';
  if (code === 'COMPANY_INACTIVE') return 'Company deactivated';
  if (code === 'SUBSCRIPTION_EXPIRED') return 'Subscription ended';
  return 'Access denied';
}

/**
 * Client-side account gate:
 * - On app start / route change, verifies user, company, and subscription via API
 * - Deactivated user/company → dialog then logout
 * - Expired subscription → /plans
 * - POS-only tier → block ERP paths, redirect to /pos
 * - Polls every 20 seconds while inside the app
 */
export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [blocking, setBlocking] = useState(false);
  const [denied, setDenied] = useState<{ title: string; message: string } | null>(null);
  const checking = useRef(false);
  const deniedRef = useRef(false);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const redirectPosAwayFromErp = (posOnly: boolean) => {
      if (!posOnly || !pathname) return false;
      if (pathname === '/pos' || pathname.startsWith('/pos/')) return false;
      if (pathname === '/plans' || pathname.startsWith('/plans/')) return false;
      if (pathname === '/billing' || pathname.startsWith('/billing/')) return false;
      if (isErpOnlyPath(pathname)) {
        setBlocking(true);
        router.replace('/pos');
        return true;
      }
      return false;
    };

    const kickDeactivated = (code?: string, message?: string) => {
      if (deniedRef.current) return;
      deniedRef.current = true;
      const title = titleFor(code);
      const msg =
        message ||
        'Your access has been revoked. Please contact support.';
      setDenied({ title, message: msg });
      const encoded = encodeURIComponent(msg);
      logoutTimer.current = setTimeout(() => {
        void performLogout(`/login?msg=${encoded}`);
      }, 4000);
    };

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

      const cached = readCachedSubscription();
      const cachedPosOnly = isPosOnlyTier(
        readCachedProductTier() || cached.productTier,
        cached.subscription.plan,
        cached.hasAccess
      );
      if (redirectPosAwayFromErp(cachedPosOnly)) return;

      if (checking.current) return;
      checking.current = true;
      try {
        const access = await fetchSessionAccess();
        if (cancelled) return;

        if (access.code === 'USER_INACTIVE' || access.code === 'COMPANY_INACTIVE') {
          setBlocking(true);
          kickDeactivated(access.code, access.message);
          return;
        }

        if (!access.hasAccess) {
          setBlocking(true);
          router.replace('/plans');
          return;
        }

        const cachedAccess = readCachedHasAccess();
        if (cachedAccess === false) {
          setBlocking(true);
          router.replace('/plans');
          return;
        }

        try {
          const cap = await fetchSubscriptionCapacity();
          if (!cancelled && cap.success && cap.data) {
            const posOnly = isPosOnlyTier(
              cap.data.productTier,
              cap.data.subscriptionPlan,
              true
            );
            if (redirectPosAwayFromErp(posOnly)) return;
          }
        } catch {
          /* capacity optional for ERP users */
        }

        setBlocking(false);
      } catch {
        // Network blip — keep current page; API 403 still protects
      } finally {
        checking.current = false;
      }
    };

    runCheck();
    timer = setInterval(runCheck, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void runCheck();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname, router]);

  const confirmLogout = () => {
    const msg = encodeURIComponent(denied?.message || 'Access denied');
    void performLogout(`/login?msg=${msg}`);
  };

  return (
    <>
      {denied && (
        <AccessDeniedDialog
          title={denied.title}
          message={denied.message}
          onConfirm={confirmLogout}
        />
      )}
      {blocking && !denied && !isSubscriptionExemptPath(pathname || '') ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1088dd] border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </>
  );
}
