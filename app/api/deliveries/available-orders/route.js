const { NextResponse } = require('next/server');
const axios = require('axios');
const { API_BASE_URL } = require('../../../lib/constants');

// GET /api/deliveries/available-orders - Get available orders for delivery
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const locationId = searchParams.get('locationId') || '';

    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const params = { search, limit };
    if (locationId) params.locationId = locationId;

    const response = await axios.get(`${API_BASE_URL}/api/deliveries/available-orders`, {
      headers,
      params,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching available orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch available orders' },
      { status: 500 }
    );
  }
}
