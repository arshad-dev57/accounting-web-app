const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const locationId = searchParams.get('locationId') || '';

    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const params = { search, limit };
    if (locationId) params.locationId = locationId;

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices/available-orders`, {
      headers,
      params,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Available orders API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch available orders' },
      { status: 500 }
    );
  }
}
