'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Login OTP is no longer used on web ERP (direct password login).
 * Mobile apps still use /api/users/verify-login-otp on the backend.
 * Keep this route as a redirect so old bookmarks don't break.
 */
function RedirectAway() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get('email');
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    router.replace(`/login${q}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LoginOtpRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RedirectAway />
    </Suspense>
  );
}
