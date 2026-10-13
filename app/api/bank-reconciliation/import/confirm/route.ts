import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_URL || 'https://account-backend-five.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authHeaders(request: NextRequest) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  const companyId =
    request.headers.get('x-company-id') ||
    request.cookies.get('active_company_id')?.value ||
    '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) headers['X-Company-Id'] = companyId;
  return headers;
}

/** POST JSON confirm — App Router proxy so import/confirm is never lost to rewrite gaps */
export async function POST(request: NextRequest) {
  try {
    const headers = authHeaders(request);
    if (!headers.Authorization) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.text();
    const target = `${API_BASE_URL}/api/bank-reconciliation/import/confirm`;
    const response = await fetch(target, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response from bank reconciliation import service',
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('bank reconciliation import confirm proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to reach backend for statement import confirm',
      },
      { status: 502 }
    );
  }
}
