import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';

    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    console.log('📊 [Recent Transactions API] Limit:', limit);
    console.log('📊 [Recent Transactions API] Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-transactions?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📊 [Recent Transactions API] Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [Recent Transactions API] Backend Error:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Recent Transactions API] Success:', data.success);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Recent Transactions API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
