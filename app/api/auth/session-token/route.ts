import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns auth tokens from httpOnly cookies so the browser apiClient can
 * sync localStorage when the user has a valid session cookie only.
 * Needed after login redirect from app.* → {slug}.* (localStorage is origin-scoped).
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value?.trim();
  const refreshToken = request.cookies.get('refresh_token')?.value?.trim();

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 },
    );
  }

  let user: unknown = null;
  const rawUser = request.cookies.get('user_data')?.value;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      try {
        user = JSON.parse(decodeURIComponent(rawUser));
      } catch {
        user = null;
      }
    }
  }

  return NextResponse.json({
    success: true,
    token,
    refreshToken: refreshToken || '',
    user,
  });
}
