import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(request: NextRequest) {
  return (
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  );
}

function buildQuery(searchParams: URLSearchParams) {
  const qs = new URLSearchParams();
  for (const key of [
    'page',
    'limit',
    'search',
    'status',
    'startDate',
    'endDate',
    'sortBy',
    'sortOrder',
    'locationId',
    'fiscalYearId',
  ]) {
    const value = searchParams.get(key);
    if (value !== null && value !== '') {
      qs.set(key, value);
    }
  }
  if (!qs.has('page')) qs.set('page', '1');
  if (!qs.has('limit')) qs.set('limit', '10');
  return qs;
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const qs = buildQuery(new URL(request.url).searchParams);
    const response = await fetch(
      `${API_BASE_URL}/api/journal-entries?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch journal entries';
    console.error('❌ [Journal Entries API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/journal-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create journal entry';
    console.error('❌ [Journal Entries API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/journal-entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete journal entry';
    console.error('❌ [Journal Entries API]', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
