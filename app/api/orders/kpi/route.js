import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/orders/sales/kpi - Get sales order KPI
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';

    const response = await apiClient.get(`/orders/kpi?type=${type}`, true);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales order KPI:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales order KPI' },
      { status: 500 }
    );
  }
}
