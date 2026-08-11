import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/login-otp', '/register'];
  const subscriptionRoutes = ['/plans'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isSubscriptionRoute = subscriptionRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Unauthenticated → login (except public auth pages)
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
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
