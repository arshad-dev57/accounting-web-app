import { NextRequest, NextResponse } from 'next/server';
import { applyClearedAuthCookies } from '@/lib/auth-cookies';

function loginUrl(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('logout', '1');
  return url;
}

function logoutResponse(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const response = NextResponse.redirect(loginUrl(request), 303);
  applyClearedAuthCookies(response, host);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

export async function POST(request: NextRequest) {
  return logoutResponse(request);
}

export async function GET(request: NextRequest) {
  return logoutResponse(request);
}
