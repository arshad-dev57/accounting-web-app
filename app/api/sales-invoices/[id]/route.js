const axios = require('axios');

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices/${params.id}`, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Get sales invoice API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch sales invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.put(`${BACKEND_URL}/api/sales/invoices/${params.id}`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Update sales invoice API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to update sales invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.delete(`${BACKEND_URL}/api/sales/invoices/${params.id}`, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Delete sales invoice API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to delete sales invoice' },
      { status: 500 }
    );
  }
}
