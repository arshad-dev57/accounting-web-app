// app/api/quotations/[id]/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/quotations/${params.id}`,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`GET /api/quotations/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/quotations/${params.id}`,
      body,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`PUT /api/quotations/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/quotations/${params.id}`,
      { headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`DELETE /api/quotations/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
