import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    };

    response.cookies.set('auth_token', '', cookieOpts);
    response.cookies.set('refresh_token', '', cookieOpts);
    response.cookies.set('user_data', '', cookieOpts);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
