import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns auth tokens from httpOnly cookies so the browser apiClient can
 * sync localStorage when the user has a valid session cookie only.
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

  return NextResponse.json({
    success: true,
    token,
    refreshToken: refreshToken || '',
  });
}
