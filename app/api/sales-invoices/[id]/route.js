const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'https://account-backend-five.vercel.app';

async function resolveId(params) {
  const resolved = typeof params?.then === 'function' ? await params : params;
  return resolved?.id;
}

export async function GET(request, { params }) {
  try {
    const id = await resolveId(params);
    if (!id) {
      return Response.json({ success: false, message: 'Invoice id is required' }, { status: 400 });
    }

    const token = request.headers.get('authorization');
    const companyId =
      request.headers.get('x-company-id') ||
      request.headers.get('x-active-company-id');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }
    if (companyId) {
      headers['X-Company-Id'] = companyId;
    }

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices/${id}`, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Get sales invoice API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      {
        success: false,
        message:
          error.response?.data?.message || error.message || 'Failed to fetch sales invoice',
      },
      { status }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = await resolveId(params);
    if (!id) {
      return Response.json({ success: false, message: 'Invoice id is required' }, { status: 400 });
    }

    const body = await request.json();
    const token = request.headers.get('authorization');
    const companyId =
      request.headers.get('x-company-id') ||
      request.headers.get('x-active-company-id');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }
    if (companyId) {
      headers['X-Company-Id'] = companyId;
    }

    const response = await axios.put(`${BACKEND_URL}/api/sales/invoices/${id}`, body, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Update sales invoice API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      {
        success: false,
        message:
          error.response?.data?.message || error.message || 'Failed to update sales invoice',
      },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await resolveId(params);
    if (!id) {
      return Response.json({ success: false, message: 'Invoice id is required' }, { status: 400 });
    }

    const token = request.headers.get('authorization');
    const companyId =
      request.headers.get('x-company-id') ||
      request.headers.get('x-active-company-id');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }
    if (companyId) {
      headers['X-Company-Id'] = companyId;
    }

    const response = await axios.delete(`${BACKEND_URL}/api/sales/invoices/${id}`, {
      headers,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Delete sales invoice API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return Response.json(
      {
        success: false,
        message:
          error.response?.data?.message || error.message || 'Failed to delete sales invoice',
      },
      { status }
    );
  }
}
