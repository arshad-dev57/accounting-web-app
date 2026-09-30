import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_URL || 'https://account-backend-five.vercel.app'
).trim().replace(/\/+$/, '');

export const runtime = 'nodejs';
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

export async function GET(request: NextRequest) {
  try {
    const headers = authHeaders(request);
    if (!headers.Authorization) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/warehouse/inventory/import/template`,
      { method: 'GET', headers, cache: 'no-store' }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: data.message || 'Template download failed' },
        { status: response.status }
      );
    }

    const buf = await response.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="Factory_ERP_Inventory_Import.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('inventory import template proxy error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Template proxy failed' },
      { status: 502 }
    );
  }
}
