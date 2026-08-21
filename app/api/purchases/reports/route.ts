import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const qs = new URLSearchParams();
    for (const key of [
      'channel',
      'period',
      'startDate',
      'endDate',
      'status',
      'search',
      'page',
      'limit',
      'fiscalYearId',
      'locationId',
    ]) {
      const v = searchParams.get(key);
      if (v) qs.set(key, v);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/purchase/reports?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load purchase report';
    console.error('❌ [Purchase Reports API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
