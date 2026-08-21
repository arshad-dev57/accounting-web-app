import { NextRequest, NextResponse } from 'next/server';
import { LOGGED_IN_COOKIE, clearCookieOptions } from '@/lib/auth-cookies';

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('auth_token', '', clearCookieOptions(true));
    response.cookies.set('refresh_token', '', clearCookieOptions(true));
    response.cookies.set('user_data', '', clearCookieOptions(true));
    response.cookies.set('subscription_access', '', clearCookieOptions(false));
    response.cookies.set(LOGGED_IN_COOKIE, '', clearCookieOptions(false));

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
