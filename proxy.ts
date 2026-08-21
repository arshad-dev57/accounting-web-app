import { NextRequest, NextResponse } from 'next/server';

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ||
  'https://bisonstechs.com';

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

  // Brand / smart entry: session → dashboard path, else marketing website
  if (pathname === '/' || pathname === '/enter') {
    if (!token) {
      return NextResponse.redirect(MARKETING_URL);
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // /enter with token — page also redirects; pass through
    return NextResponse.next();
  }

  // Unauthenticated app access -> public website
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(MARKETING_URL);
  }

  // Authenticated users shouldn't sit on login
  if (token && pathname === '/login') {
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Known-expired sessions: block app routes until they purchase/renew
  if (token && !isPublicRoute && !isSubscriptionRoute) {
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)',
  ],
};
