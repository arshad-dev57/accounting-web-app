const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.post(`${BACKEND_URL}/api/sales/invoices/create-multi`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Create multi-source invoice API proxy error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Failed to create sales invoice';
    return Response.json({ success: false, message }, { status });
  }
}
