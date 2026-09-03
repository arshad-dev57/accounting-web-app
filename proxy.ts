import { NextRequest, NextResponse } from 'next/server';
import {
  LOGOUT_FLAG_COOKIE,
  applyClearedAuthCookies,
} from '@/lib/auth-cookies';

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ||
  'https://bisonstechs.com';

function redirectToAppLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = '/login';
  url.search = '';
  if (nextPath && nextPath !== '/login' && nextPath !== '/') {
    url.searchParams.set('next', nextPath);
  }
  return NextResponse.redirect(url);
}

function isLoggingOut(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get('logout') === '1' ||
    request.cookies.get(LOGOUT_FLAG_COOKIE)?.value === '1'
  );
}

function allowLoginAndStripCookies(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const response = NextResponse.next();
  applyClearedAuthCookies(response, host, [
    { name: LOGOUT_FLAG_COOKIE, httpOnly: false },
  ]);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

function redirectToLoginAndStripCookies(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = 'logout=1';
  const response = NextResponse.redirect(url);
  applyClearedAuthCookies(response, host);
  return response;
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    '/login',
    '/login-otp',
    '/register',
    '/enter',
    '/forgot-password',
    '/reset-password',
  ];
  const subscriptionRoutes = ['/plans'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isSubscriptionRoute = subscriptionRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Desktop installer files in public/downloads — no login required
  if (pathname.startsWith('/downloads/')) {
    return NextResponse.next();
  }

  // Logout in progress: never bounce /login → /dashboard, and expire leftover
  // httpOnly auth cookies on this response so the reload loop cannot continue.
  if (isLoggingOut(request)) {
    if (isPublicRoute && pathname !== '/' && pathname !== '/enter') {
      return allowLoginAndStripCookies(request);
    }
    return redirectToLoginAndStripCookies(request);
  }

  // Marketing first: no session on `/` → website. /enter is the app gate.
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(MARKETING_URL);
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    const tier = request.cookies.get('product_tier')?.value;
    return NextResponse.redirect(
      new URL(tier === 'pos' ? '/pos' : '/dashboard', request.url)
    );
  }

  if (pathname === '/enter') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    const tier = request.cookies.get('product_tier')?.value;
    return NextResponse.redirect(
      new URL(tier === 'pos' ? '/pos' : '/dashboard', request.url)
    );
  }

  if (!token && !isPublicRoute) {
    return redirectToAppLogin(request);
  }

  if (token && (pathname === '/login' || pathname === '/login-otp' || pathname === '/register')) {
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    const tier = request.cookies.get('product_tier')?.value;
    return NextResponse.redirect(
      new URL(tier === 'pos' ? '/pos' : '/dashboard', request.url)
    );
  }

  if (token && !isPublicRoute && !isSubscriptionRoute) {
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|downloads/|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff2?).*)',
  ],
};
