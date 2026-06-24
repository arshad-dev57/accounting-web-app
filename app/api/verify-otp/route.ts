// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/users/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const token = data.token;
      const refreshToken = data.refreshToken;

      // ✅ Prepare response with token in body
      const nextResponse = NextResponse.json({
        success: true,
        user: data.user,
        token: token,                 // ← Include token for client-side storage
        refreshToken: refreshToken,   // ← Include refreshToken
      });

      // Also set httpOnly cookies (for server-side authentication)
      if (token) {
        nextResponse.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
      }

      if (refreshToken) {
        nextResponse.cookies.set('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });
      }

      if (data.user) {
        nextResponse.cookies.set('user_data', JSON.stringify(data.user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
      }

      return nextResponse;
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Invalid OTP' },
      { status: response.status }
    );
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}