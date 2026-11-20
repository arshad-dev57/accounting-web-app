import { NextResponse } from 'next/server';
import axios from 'axios';
import { backendProxyHeaders } from '@/lib/company-api-headers';

const BACKEND_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function PUT(request, { params }) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const response = await axios.put(
      `${BACKEND_URL}/api/warehouse/inventory/uoms/${encodeURIComponent(id)}`,
      body,
      { headers }
    );
    return NextResponse.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update unit',
      },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const response = await axios.delete(
      `${BACKEND_URL}/api/warehouse/inventory/uoms/${encodeURIComponent(id)}`,
      { headers }
    );
    return NextResponse.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete unit',
      },
      { status }
    );
  }
}
