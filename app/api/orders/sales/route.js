import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/orders/sales - Get all sales orders
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const sortBy = searchParams.get('sortBy') || 'orderDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const orderType = searchParams.get('orderType') || 'Sales Order';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const priority = searchParams.get('priority') || '';
    const locationId = searchParams.get('locationId') || '';

    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      orderType,
    };

    if (search) params.search = search;
    if (status) params.status = status;
    if (paymentStatus) params.paymentStatus = paymentStatus;
    if (priority) params.priority = priority;
    if (locationId) params.locationId = locationId;

    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/api/orders/sales?${queryString}`, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders/sales - Create sales order
export async function POST(request) {
  try {
    const body = await request.json();

    const response = await apiClient.post('/api/orders/sales', body, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating sales order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create sales order' },
      { status: 500 }
    );
  }
}