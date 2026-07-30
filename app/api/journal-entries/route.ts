import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    console.log('📊 [Journal Entries API] Fetching entries from backend');
    const response = await fetch(`${API_BASE_URL}/api/journal-entries${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [Journal Entries API] Backend error:', response.status);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Journal Entries API] Successfully fetched entries');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Journal Entries API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📊 [Journal Entries API] Creating entry:', body);
    
    const response = await fetch(`${API_BASE_URL}/api/journal-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ [Journal Entries API] Backend error:', response.status);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Journal Entries API] Successfully created entry');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Journal Entries API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Entry ID is required' },
        { status: 400 }
      );
    }
    
    console.log('📊 [Journal Entries API] Deleting entry:', id);
    const response = await fetch(`${API_BASE_URL}/api/journal-entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [Journal Entries API] Backend error:', response.status);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Journal Entries API] Successfully deleted entry');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Journal Entries API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}
