import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    console.log('📊 [Chart of Accounts API] Fetching accounts from backend');
    const response = await fetch(`${API_BASE_URL}/api/chart-of-accounts${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [Chart of Accounts API] Backend error:', response.status);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Chart of Accounts API] Successfully fetched accounts');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Chart of Accounts API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch chart of accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📊 [Chart of Accounts API] Creating account:', body);
    
    const response = await fetch(`${API_BASE_URL}/api/chart-of-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ [Chart of Accounts API] Backend error:', response.status);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Chart of Accounts API] Successfully created account');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Chart of Accounts API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
