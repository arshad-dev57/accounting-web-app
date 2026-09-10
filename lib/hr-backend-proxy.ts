import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export function getHrAuthToken(request: NextRequest) {
  return (
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

export async function proxyToHrBackend(
  request: NextRequest,
  backendPath: string
) {
  const token = getHrAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const target = `${API_BASE_URL}/api/hr${backendPath}${url.search}`;
  const method = request.method.toUpperCase();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    const text = await request.text();
    if (text) init.body = text;
  }

  const response = await fetch(target, init);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from HR service',
  }));
  return NextResponse.json(data, { status: response.status });
}
