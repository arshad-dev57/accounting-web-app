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

    const response = await axios.post(`${BACKEND_URL}/api/sales/invoices/from-order`, body, {
      headers,
    });

    return Response.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Create invoice from order API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to create invoice from order' },
      { status: 500 }
    );
  }
}
