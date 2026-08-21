import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// POST /api/orders/sales/[id]/cancel - Cancel order
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const response = await apiClient.post(`/api/orders/${id}/cancel`, body, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
