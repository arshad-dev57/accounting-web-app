import { NextRequest, NextResponse } from 'next/server';

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

  // Marketing first: no session on `/` → website. /enter is the app gate.
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(MARKETING_URL);
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/enter') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && !isPublicRoute) {
    return redirectToAppLogin(request);
  }

  if (token && (pathname === '/login' || pathname === '/login-otp' || pathname === '/register')) {
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff2?).*)',
  ],
};
