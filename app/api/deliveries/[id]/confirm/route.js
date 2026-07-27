const { NextResponse } = require('next/server');
const axios = require('axios');
const { API_BASE_URL } = require('../../../../lib/constants');

// POST /api/deliveries/[id]/confirm - Confirm delivery
export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.post(`${API_BASE_URL}/api/deliveries/${params.id}/confirm`, body, {
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}
