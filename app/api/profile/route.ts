import { NextRequest, NextResponse } from 'next/server';
import { backendProxyHeaders } from '@/lib/company-api-headers';
import { API_BASE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { token, headers } = backendProxyHeaders(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, headers } = backendProxyHeaders(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // FormData multipart — do not force Content-Type (browser/boundary)
    const forwardHeaders: Record<string, string> = {};
    if (headers.Authorization) forwardHeaders.Authorization = headers.Authorization;
    if (headers['X-Company-Id']) forwardHeaders['X-Company-Id'] = headers['X-Company-Id'];

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: forwardHeaders,
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
