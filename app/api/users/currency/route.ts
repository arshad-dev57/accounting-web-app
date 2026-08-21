import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyCode, currencySymbol } = body;

    if (!currencyCode || !currencySymbol) {
      return NextResponse.json(
        { success: false, message: 'Currency code and symbol are required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const cookieToken = request.cookies.get('auth_token')?.value;
    const authorization =
      authHeader || (cookieToken ? `Bearer ${cookieToken}` : '');

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/users/currency`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({ currencyCode, currencySymbol }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to update currency' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update currency' },
      { status: 500 }
    );
  }
}
