const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const headers = {};
    if (token) headers['Authorization'] = token;

    const response = await axios.get(`${BACKEND_URL}/api/warehouse/transfers/${id}`, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error(`API /warehouse/transfers/${params.id} GET error:`, error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      error.response?.data || { success: false, message: error.message },
      { status }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    const body = await request.json();

    const response = await axios.put(`${BACKEND_URL}/api/warehouse/transfers/${id}`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error(`API /warehouse/transfers/${params.id} PUT error:`, error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      error.response?.data || { success: false, message: error.message },
      { status }
    );
  }
}
