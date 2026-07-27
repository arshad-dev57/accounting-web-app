// app/api/sales/dashboard/route.js
import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const response = await apiClient.get(`/api/warehouse/sales/dashboard?period=${period}`);
    
    // Provide default data structure if API fails or returns incomplete data
    if (!response.success || !response.data) {
      return NextResponse.json({
        success: true,
        data: {
          orders: {
            count: 0,
            revenue: 0,
            byStatus: [],
            trend: [],
          },
          invoices: {
            stats: {
              grandTotal: 0,
              paidAmount: 0,
              outstanding: 0,
              total: 0,
            },
            trend: [],
          },
          returns: {},
          refunds: {},
          comparison: {
            today: {
              currentSales: 0,
              priorSales: 0,
              currentReturns: 0,
              priorReturns: 0,
              salesChangePercent: 0,
              returnsChangePercent: 0,
            },
            week: {
              currentSales: 0,
              priorSales: 0,
              currentReturns: 0,
              priorReturns: 0,
              salesChangePercent: 0,
              returnsChangePercent: 0,
            },
            month: {
              currentSales: 0,
              priorSales: 0,
              currentReturns: 0,
              priorReturns: 0,
              salesChangePercent: 0,
              returnsChangePercent: 0,
            },
            year: {
              currentSales: 0,
              priorSales: 0,
              currentReturns: 0,
              priorReturns: 0,
              salesChangePercent: 0,
              returnsChangePercent: 0,
            },
          },
          recentActivity: [],
          topProducts: [],
          topCustomers: [],
          revenueBreakdown: {
            grossRevenue: 0,
            lineItemDiscounts: 0,
            orderLevelDiscounts: 0,
            netRevenue: 0,
            taxAmount: 0,
            shippingAmount: 0,
          },
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/sales/dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
