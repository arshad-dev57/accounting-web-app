import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔵 Login Request:', body);

    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('🔵 Backend Response:', data);

    // ✅ Agar backend se success aa raha hai toh OTP required bhejo
    if (response.ok && data.success) {
      return NextResponse.json({ 
        success: true, 
        requiresOtp: true,
        email: body.email 
      });
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Login failed' },
      { status: response.status }
    );
  } catch (error: any) {
    console.log('🔴 Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}