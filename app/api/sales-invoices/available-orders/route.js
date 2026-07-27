const axios = require('axios');

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';

    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices/available-orders`, {
      headers,
      params: { search, limit },
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
