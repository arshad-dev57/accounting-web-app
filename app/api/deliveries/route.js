const { NextResponse } = require('next/server');
const axios = require('axios');
const { API_BASE_URL } = require('../../lib/constants');

// GET /api/deliveries - Get all deliveries with filters
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const params = { page, limit };
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await axios.get(`${API_BASE_URL}/api/deliveries`, {
      headers,
      params,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

// POST /api/deliveries - Create delivery
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.post(`${API_BASE_URL}/api/deliveries`, body, {
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
