const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function POST(request, { params }) {
  try {
    const { id, action } = params;
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body might be empty for actions like confirm/complete
    }

    const response = await axios.post(`${BACKEND_URL}/api/warehouse/transfers/${id}/${action}`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error(`API /warehouse/transfers/${params.id}/${params.action} POST error:`, error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      error.response?.data || { success: false, message: error.message },
      { status }
    );
  }
}
