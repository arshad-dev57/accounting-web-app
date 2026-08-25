const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const id = params?.id;
    const response = await axios.post(
      `${BACKEND_URL}/api/sales/invoices/${id}/cancel`,
      body,
      { headers }
    );

    return Response.json(response.data);
  } catch (error) {
    console.error('Cancel sales invoice API error:', error);
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to cancel sales invoice';
    return Response.json({ success: false, message }, { status });
  }
}
