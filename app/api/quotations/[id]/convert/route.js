// app/api/quotations/[id]/convert/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const body = await request.json().catch(() => ({}));

    const response = await axios.post(
      `${API_BASE_URL}/api/quotations/${params.id}/convert`,
      body,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`POST /api/quotations/${params.id}/convert error:`, error);
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Server error';
    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
