import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// PATCH /api/orders/sales/[id]/status - Update order status
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const response = await apiClient.patch(`/api/orders/${id}/status`, body, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
