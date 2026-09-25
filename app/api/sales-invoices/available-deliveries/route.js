const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const locationId = searchParams.get('locationId') || '';

    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const params = { search, page, limit };
    if (locationId) params.locationId = locationId;

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices/available-deliveries`, {
      headers,
      params,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Available deliveries API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch available deliveries' },
      { status: 500 }
    );
  }
}
