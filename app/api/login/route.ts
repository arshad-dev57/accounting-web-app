import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';
import {
  AUTH_TOKEN_MAX_AGE,
  LOGGED_IN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  httpOnlyAuthCookie,
  loggedInCookieOptions,
  publicAuthCookie,
} from '@/lib/auth-cookies';

function applyAuthCookies(
  response: NextResponse,
  data: {
    token?: string;
    refreshToken?: string;
    user?: unknown;
  },
  requestHost: string
) {
  if (data.token) {
    response.cookies.set(
      'auth_token',
      data.token,
      httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE, requestHost)
    );
  }
  if (data.refreshToken) {
    response.cookies.set(
      'refresh_token',
      data.refreshToken,
      httpOnlyAuthCookie(REFRESH_TOKEN_MAX_AGE, requestHost)
    );
  }
  if (data.user) {
    response.cookies.set(
      'user_data',
      JSON.stringify(data.user),
      httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE, requestHost)
    );
  }

  const sub = (data.user as { subscription?: { status?: string } } | undefined)
    ?.subscription;
  const hintActive = sub?.status === 'active';
  response.cookies.set(
    'subscription_access',
    hintActive ? '1' : '0',
    publicAuthCookie(AUTH_TOKEN_MAX_AGE, requestHost)
  );
  response.cookies.set(
    LOGGED_IN_COOKIE,
    '1',
    loggedInCookieOptions(AUTH_TOKEN_MAX_AGE, requestHost)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and password' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Web ERP: skip OTP. Mobile apps omit this flag and still get OTP.
      body: JSON.stringify({
        email,
        password,
        directLogin: true,
        client: 'web',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Invalid email or password',
          code: data.code,
        },
        { status: response.status || 401 }
      );
    }

    // Direct login returns token immediately (no OTP step)
    if (data.token && data.user) {
      const nextResponse = NextResponse.json({
        success: true,
        requiresOtp: false,
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        pdfReportSettings:
          data.pdfReportSettings || data.user?.pdfReportSettings || null,
      });
      applyAuthCookies(nextResponse, data, request.headers.get('host') || '');
      return nextResponse;
    }

    // Safety: if backend still returned OTP flow, surface it (should not happen for web)
    if (data.requiresOtp) {
      return NextResponse.json({
        success: true,
        requiresOtp: true,
        email,
        message: data.message || 'OTP required',
      });
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Login failed' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
