import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_TOKEN_MAX_AGE,
  LOGGED_IN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  httpOnlyAuthCookie,
  loggedInCookieOptions,
  publicAuthCookie,
} from '@/lib/auth-cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || `Registration failed (${response.status})`,
          error: data.error,
        },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(data, { status: response.status });

    if (data.token) {
      nextResponse.cookies.set(
        'auth_token',
        data.token,
        httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE)
      );
    }

    if (data.refreshToken) {
      nextResponse.cookies.set(
        'refresh_token',
        data.refreshToken,
        httpOnlyAuthCookie(REFRESH_TOKEN_MAX_AGE)
      );
    }

    if (data.user) {
      nextResponse.cookies.set(
        'user_data',
        JSON.stringify(data.user),
        httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE)
      );
    }

    // New registrations auto-start a 30-day trial on the backend
    nextResponse.cookies.set(
      'subscription_access',
      '1',
      publicAuthCookie(AUTH_TOKEN_MAX_AGE)
    );

    nextResponse.cookies.set(
      LOGGED_IN_COOKIE,
      '1',
      loggedInCookieOptions(AUTH_TOKEN_MAX_AGE)
    );

    return nextResponse;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ [Register API]', message);
    return NextResponse.json(
      { success: false, message: 'Unable to reach registration service' },
      { status: 500 }
    );
  }
}
