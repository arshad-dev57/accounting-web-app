import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/users/resend-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email }),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      {
        success: Boolean(data.success),
        message: data.message || (response.ok ? 'OTP resent' : 'Failed to resend OTP'),
        retryAfterSeconds: data.retryAfterSeconds,
      },
      { status: response.status }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to resend OTP';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
