import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_URL || 'https://account-backend-five.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

export const runtime = 'nodejs';
export const maxDuration = 60;

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

/** Poll import batch status (async confirm). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const headers = authHeaders(request);
    if (!headers.Authorization) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/warehouse/inventory/import/batches/${batchId}`,
      { method: 'GET', headers, cache: 'no-store' }
    );
    const data = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response from inventory import service',
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('inventory import batch status proxy error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Batch status proxy failed' },
      { status: 502 }
    );
  }
}
