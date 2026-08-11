import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, sale, companyProfile, receiptMeta } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/pos/send-receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        sale,
        companyProfile,
        receiptMeta,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send receipt' },
      { status: 500 }
    );
  }
}
