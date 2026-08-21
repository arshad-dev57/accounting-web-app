// app/api/dashboard/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = searchParams.get('timePeriod') || 'This Month';
    const limit = searchParams.get('limit') || '10';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const fiscalYearId = searchParams.get('fiscalYearId');
    const locationId = searchParams.get('locationId');

    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const qs = new URLSearchParams({ timePeriod, limit });
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    if (fiscalYearId) qs.set('fiscalYearId', fiscalYearId);
    if (locationId) qs.set('locationId', locationId);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/overview?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/dashboard/overview error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
