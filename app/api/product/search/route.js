// app/api/product/search/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';
    const locationId = searchParams.get('locationId') || '';

    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const params = new URLSearchParams({ q, limit });
    if (locationId) params.append('locationId', locationId);

    const response = await axios.get(
      `${API_BASE_URL}/api/warehouse/products/search?${params.toString()}`,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('GET /api/product/search error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
