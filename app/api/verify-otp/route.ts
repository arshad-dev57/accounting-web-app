// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_TOKEN_MAX_AGE,
  LOGGED_IN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  httpOnlyAuthCookie,
  loggedInCookieOptions,
  publicAuthCookie,
} from '@/lib/auth-cookies';

import { API_BASE_URL } from '@/lib/constants';

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
        pdfReportSettings:
          data.pdfReportSettings || data.user?.pdfReportSettings || null,
      });

      console.log('🍪 [OTP API] Setting cookies');

      // Also set httpOnly cookies (for server-side authentication)
      // COOKIE_DOMAIN=.bisonstechs.com enables marketing site session awareness
      if (token) {
        nextResponse.cookies.set(
          'auth_token',
          token,
          httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE)
        );
        console.log('✅ [OTP API] Auth token cookie set');
      }

      if (refreshToken) {
        nextResponse.cookies.set(
          'refresh_token',
          refreshToken,
          httpOnlyAuthCookie(REFRESH_TOKEN_MAX_AGE)
        );
        console.log('✅ [OTP API] Refresh token cookie set');
      }

      if (data.user) {
        nextResponse.cookies.set(
          'user_data',
          JSON.stringify(data.user),
          httpOnlyAuthCookie(AUTH_TOKEN_MAX_AGE)
        );
        console.log('✅ [OTP API] User data cookie set');
      }

      // Hint for proxy — client will refresh accurately via /api/subscription/status
      const sub = data.user?.subscription;
      const hintActive = sub?.status === 'active';
      nextResponse.cookies.set(
        'subscription_access',
        hintActive ? '1' : '0',
        publicAuthCookie(AUTH_TOKEN_MAX_AGE)
      );

      // Readable by bisonstechs.com so Sign In ↔ Dashboard can switch
      nextResponse.cookies.set(
        LOGGED_IN_COOKIE,
        '1',
        loggedInCookieOptions(AUTH_TOKEN_MAX_AGE)
      );

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