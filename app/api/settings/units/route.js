import { NextResponse } from 'next/server';
import axios from 'axios';
import { backendProxyHeaders } from '@/lib/company-api-headers';

const BACKEND_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function GET(request) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const response = await axios.get(`${BACKEND_URL}/api/warehouse/inventory/uoms`, {
      headers,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to load units',
      },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const { token, headers } = backendProxyHeaders(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const response = await axios.post(`${BACKEND_URL}/api/warehouse/inventory/uoms`, body, {
      headers,
    });
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create unit',
      },
      { status }
    );
  }
}
