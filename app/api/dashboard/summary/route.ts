import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = searchParams.get('timePeriod') || 'This Month';

    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    console.log('📊 [Dashboard Summary API] Time Period:', timePeriod);
    console.log('📊 [Dashboard Summary API] Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/dashboard/summary?timePeriod=${timePeriod}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📊 [Dashboard Summary API] Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [Dashboard Summary API] Backend Error:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Dashboard Summary API] Success:', data.success);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Dashboard Summary API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
