import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Reset session expired. Please request a new OTP.' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      }),
    });

    const data = await response.json();

    return NextResponse.json(
      { success: data.success, message: data.message },
      { status: response.status }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
