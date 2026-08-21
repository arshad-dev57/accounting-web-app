import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxySubscription(request: NextRequest, pathSegments: string[]) {
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
    const url = new URL(`${API_BASE_URL}/api/subscription/${suffix}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const init: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
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
      error instanceof Error ? error.message : 'Subscription request failed';
    console.error('❌ [Subscription API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxySubscription(request, path || []);
}

export async function POST(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxySubscription(request, path || []);
}

export async function PUT(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxySubscription(request, path || []);
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxySubscription(request, path || []);
}
