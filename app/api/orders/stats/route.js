import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/orders/sales/stats - Get sales order statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';

    const response = await apiClient.get(`/api/orders/stats?type=${type}`, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales order stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales order stats' },
      { status: 500 }
    );
  }
}
