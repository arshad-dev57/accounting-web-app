const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization');
    const headers = {};
    if (token) headers['Authorization'] = token;

    const response = await axios.get(`${BACKEND_URL}/api/warehouse/transfers/product-stock`, {
      headers,
      params: Object.fromEntries(searchParams.entries()),
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('API /warehouse/transfers/product-stock GET error:', error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      error.response?.data || { success: false, message: error.message },
      { status }
    );
  }
}
