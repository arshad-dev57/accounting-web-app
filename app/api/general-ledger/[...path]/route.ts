import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxyGeneralLedger(request: NextRequest, pathSegments: string[]) {
  try {
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

    const suffix = pathSegments.join('/');
    const url = new URL(`${API_BASE_URL}/api/general-ledger/${suffix}`);

    const allowed = [
      'page',
      'limit',
      'search',
      'accountId',
      'startDate',
      'endDate',
      'showDebitOnly',
      'showCreditOnly',
      'sortBy',
      'sortOrder',
      'status',
    ];
    for (const key of allowed) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
    if (!url.searchParams.has('page')) url.searchParams.set('page', '1');
    if (!url.searchParams.has('limit')) url.searchParams.set('limit', '10');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load general ledger';
    console.error('❌ [General Ledger API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxyGeneralLedger(request, path || []);
}
