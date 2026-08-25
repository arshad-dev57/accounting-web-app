const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.post(`${BACKEND_URL}/api/sales/invoices/${params.id}/post`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Post sales invoice API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to post sales invoice' },
      { status: 500 }
    );
  }
}
