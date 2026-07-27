// app/api/quotations/[id]/status/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();

    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.patch(
      `${API_BASE_URL}/api/quotations/${params.id}/status`,
      body,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`PATCH /api/quotations/${params.id}/status error:`, error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
