import { NextRequest, NextResponse } from 'next/server';
import { backendProxyHeaders } from '@/lib/company-api-headers';

const API_BASE_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { token, headers } = backendProxyHeaders(request);

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
      'locationId',
      'fiscalYearId',
    ]) {
      const v = searchParams.get(key);
      if (v) qs.set(key, v);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/accounting/reports?${qs.toString()}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load accounting report';
    console.error('❌ [Accounting Reports API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
