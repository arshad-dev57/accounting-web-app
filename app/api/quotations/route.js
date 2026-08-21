// app/api/quotations/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const locationId = searchParams.get('locationId') || '';

    const params = new URLSearchParams({
      page,
      limit,
    });

    if (search) params.append('search', search);
    if (status !== 'all') params.append('status', status);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (locationId) params.append('locationId', locationId);

    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/quotations?${params.toString()}`,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const response = await axios.post(
      `${API_BASE_URL}/api/quotations`,
      body,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
