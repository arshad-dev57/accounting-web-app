import { NextRequest, NextResponse } from 'next/server';

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ||
  'https://bisonstechs.com';

function isNextDataRequest(request: NextRequest) {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('Next-Router-State-Tree') != null ||
    request.headers.get('Sec-Purpose')?.includes('prefetch') === true ||
    request.headers.get('Purpose') === 'prefetch' ||
    request.nextUrl.searchParams.has('_rsc')
  );
}

function redirectToAppLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = '/login';
  url.search = '';
  if (nextPath && nextPath !== '/login') {
    url.searchParams.set('next', nextPath);
  }
  return NextResponse.redirect(url);
}

function redirectUnauthenticated(request: NextRequest) {
  // Cross-origin 302 (marketing site) on RSC/prefetch makes Chrome show
  // "This page couldn't load" until a hard reload. Stay on the app origin.
  if (isNextDataRequest(request)) {
    return redirectToAppLogin(request);
  }
  return NextResponse.redirect(MARKETING_URL);
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

  // Brand / smart entry: session → dashboard path, else marketing website
  if (pathname === '/' || pathname === '/enter') {
    if (!token) {
      return redirectUnauthenticated(request);
    }
    const access = request.cookies.get('subscription_access')?.value;
    if (access === '0') {
      return NextResponse.redirect(new URL('/plans', request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!token && !isPublicRoute) {
    return redirectUnauthenticated(request);
  }

  if (token && pathname === '/login') {
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
  if (isPublicRoute) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff2?).*)',
  ],
};
