import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Sab cookies delete karo
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user_data');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}