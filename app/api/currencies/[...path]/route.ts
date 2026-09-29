import { NextRequest, NextResponse } from 'next/server';
import { backendProxyHeaders } from '@/lib/company-api-headers';

const API_BASE_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxyCurrenciesPath(request: NextRequest, pathSegments: string[]) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const suffix = pathSegments.length ? `/${pathSegments.join('/')}` : '';
    const url = new URL(`${API_BASE_URL}/api/currencies${suffix}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const init: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) init.body = body;
    }

    const response = await fetch(url.toString(), init);
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Currency request failed';
    console.error('❌ [Currencies API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxyCurrenciesPath(request, path || []);
}

export async function POST(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxyCurrenciesPath(request, path || []);
}

export async function PUT(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxyCurrenciesPath(request, path || []);
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxyCurrenciesPath(request, path || []);
}
