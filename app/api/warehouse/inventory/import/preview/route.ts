import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_URL || 'https://account-backend-five.vercel.app'
).trim().replace(/\/+$/, '');

export const runtime = 'nodejs';
/** Large Excel uploads */
export const maxDuration = 120;

function authHeaders(request: NextRequest) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  const companyId =
    request.headers.get('x-company-id') ||
    request.cookies.get('active_company_id')?.value ||
    '';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) headers['X-Company-Id'] = companyId;
  return headers;
}

/** POST multipart preview — bypasses fragile Next rewrite for file uploads */
export async function POST(request: NextRequest) {
  try {
    const headers = authHeaders(request);
    if (!headers.Authorization) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const form = await request.formData();
    const target = `${API_BASE_URL}/api/warehouse/inventory/import/preview`;
    const response = await fetch(target, {
      method: 'POST',
      headers,
      body: form,
      // do not set Content-Type — fetch sets multipart boundary
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response from inventory import service',
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('inventory import preview proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to reach backend for inventory import. Is the API running on the configured API_URL?',
      },
      { status: 502 }
    );
  }
}
