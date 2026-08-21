import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, otp: body.otp }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return NextResponse.json({
        success: true,
        message: data.message || 'OTP verified successfully',
        resetToken: data.resetToken,
      });
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Invalid OTP' },
      { status: response.status }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OTP verification failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
