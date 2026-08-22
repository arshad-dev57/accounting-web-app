import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('� [Login API] Received request:', body);
    console.log('📧 [Login API] Email:', body.email);
    console.log('🔑 [Login API] Password length:', body.password?.length);

    // Agar backend server nahi chal raha toh mock response
    // Backend chal raha hai toh yeh call karein
    try {
      console.log('📤 [Login API] Sending to backend:', `${API_BASE_URL}/api/users/login`);
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📥 [Login API] Backend response status:', response.status);

      if (!response.ok) {
        console.log('❌ [Login API] Backend Error:', response.status);
        return NextResponse.json(
          {
            success: false,
            message: `Backend error: ${response.status}`
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('� [Login API] Backend Response Data:', data);
      console.log('✅ [Login API] Login success:', data.success);
      console.log('🔐 [Login API] Requires OTP:', data.requiresOtp);

      if (data.success) {
        console.log('✅ [Login API] Returning success with OTP requirement');
        return NextResponse.json({
          success: true,
          requiresOtp: true,
          email: body.email
        });
      }

      console.log('❌ [Login API] Login failed:', data.message);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Login failed'
        },
        { status: 400 }
      );
    } catch (fetchError) {
      // Agar backend nahi chal raha toh mock response
      console.log('⚠️ [Login API] Backend not available, using mock response');
      console.log('🔧 [Login API] Fetch error:', fetchError);

      // Mock login - test@example.com / password123
      if (body.email === 'test@example.com' && body.password === 'password123') {
        console.log('✅ [Login API] Mock login successful');
        return NextResponse.json({
          success: true,
          requiresOtp: true,
          email: body.email
        });
      }

      console.log('❌ [Login API] Mock login failed');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.log('❌ [Login API] Server Error:', error);
    console.log('❌ [Login API] Error message:', error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}