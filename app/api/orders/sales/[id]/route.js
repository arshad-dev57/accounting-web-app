import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/orders/sales/[id] - Get single sales order by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const response = await apiClient.get(`/orders/${id}`, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/sales/[id] - Update sales order
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const response = await apiClient.put(`/orders/${id}`, body, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating sales order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update sales order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/sales/[id] - Delete sales order (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const response = await apiClient.delete(`/orders/${id}`, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting sales order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sales order' },
      { status: 500 }
    );
  }
}
