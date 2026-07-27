// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [OTP API] Received OTP verification request');
    console.log('📧 [OTP API] Email:', body.email);
    console.log('🔢 [OTP API] OTP:', body.otp);
    console.log('🔢 [OTP API] OTP length:', body.otp?.length);

    console.log('📤 [OTP API] Sending to backend:', `${API_BASE_URL}/api/users/verify-login-otp`);
    const response = await fetch(`${API_BASE_URL}/api/users/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('📥 [OTP API] Backend response status:', response.status);
    const data = await response.json();
    console.log('📥 [OTP API] Backend Response Data:', data);
    console.log('✅ [OTP API] Verification success:', data.success);

    if (response.ok && data.success) {
      const token = data.token;
      const refreshToken = data.refreshToken;
      const user = data.user;

      console.log('🔑 [OTP API] Token received:', token ? 'Yes' : 'No');
      console.log('🔄 [OTP API] Refresh token received:', refreshToken ? 'Yes' : 'No');
      console.log('👤 [OTP API] User data:', user);

      // ✅ Prepare response with token in body
      const nextResponse = NextResponse.json({
        success: true,
        user: data.user,
        token: token,                 // ← Include token for client-side storage
        refreshToken: refreshToken,   // ← Include refreshToken
      });

      console.log('🍪 [OTP API] Setting cookies');

      // Also set httpOnly cookies (for server-side authentication)
      if (token) {
        nextResponse.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
        console.log('✅ [OTP API] Auth token cookie set');
      }

      if (refreshToken) {
        nextResponse.cookies.set('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });
        console.log('✅ [OTP API] Refresh token cookie set');
      }

      if (data.user) {
        nextResponse.cookies.set('user_data', JSON.stringify(data.user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
        console.log('✅ [OTP API] User data cookie set');
      }

      console.log('✅ [OTP API] Returning successful response');
      return nextResponse;
    }

    console.log('❌ [OTP API] Verification failed:', data.message);
    return NextResponse.json(
      { success: false, message: data.message || 'Invalid OTP' },
      { status: response.status }
    );
  } catch (error: any) {
    console.error('❌ [OTP API] OTP verification error:', error);
    console.error('❌ [OTP API] Error message:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}