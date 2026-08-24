const axios = require('axios');

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const locationId = searchParams.get('locationId') || '';

    const token = request.headers.get('authorization');
    const headers = {};
    if (token) {
      headers['Authorization'] = token;
    }

    const params = { page, limit };
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (paymentStatus !== 'all') params.paymentStatus = paymentStatus;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (locationId) params.locationId = locationId;

    const response = await axios.get(`${BACKEND_URL}/api/sales/invoices`, {
      headers,
      params,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error('Sales invoices API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch sales invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await axios.post(`${BACKEND_URL}/api/sales/invoices/manual`, body, {
      headers,
    });

    return Response.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Create sales invoice API error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to create sales invoice' },
      { status: 500 }
    );
  }
}
