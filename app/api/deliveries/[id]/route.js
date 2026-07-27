const { NextResponse } = require('next/server');
const axios = require('axios');
const { API_BASE_URL } = require('../../../lib/constants');

// GET /api/deliveries/[id] - Get delivery by ID
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.get(`${API_BASE_URL}/api/deliveries/${params.id}`, {
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

// PUT /api/deliveries/[id] - Update delivery
export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.put(`${API_BASE_URL}/api/deliveries/${params.id}`, body, {
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}

// DELETE /api/deliveries/[id] - Delete delivery
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await axios.delete(`${API_BASE_URL}/api/deliveries/${params.id}`, {
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete delivery' },
      { status: 500 }
    );
  }
}
