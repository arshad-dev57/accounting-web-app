// app/api/sales/dashboard/route.js
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function defaultComparison() {
  return {
    currentSales: 0,
    priorSales: 0,
    currentReturns: 0,
    priorReturns: 0,
    salesChangePercent: 0,
    returnsChangePercent: 0,
  };
}

function emptyDashboard() {
  return {
    summary: {
      totalRevenue: 0,
      totalPosSales: 0,
      totalPosRevenue: 0,
    },
    orders: {
      count: 0,
      revenue: 0,
      byStatus: [],
      trend: [],
      todayCount: 0,
      todayRevenue: 0,
      pendingCount: 0,
      revenueGrowth: '+0%',
    },
    pos: {
      count: 0,
      revenue: 0,
      discountTotal: 0,
      taxTotal: 0,
      paidAmount: 0,
      todayCount: 0,
      todayRevenue: 0,
      trend: [],
      revenueGrowth: '+0%',
    },
    invoices: {
      stats: {
        grandTotal: 0,
        revenue: 0,
        paidAmount: 0,
        outstanding: 0,
        total: 0,
      },
      trend: [],
      grandTotalGrowth: '+0%',
      paidAmountGrowth: '+0%',
      outstandingGrowth: '+0%',
    },
    returns: {},
    refunds: {},
    credits: {
      total: 0,
      creditAmount: 0,
      remainingAmount: 0,
    },
    comparison: {
      today: defaultComparison(),
      week: defaultComparison(),
      month: defaultComparison(),
      year: defaultComparison(),
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
      items: [],
    },
  };
}

/** Normalize backend payload to the shape Flutter SalesDashboardModel expects. */
function normalizeDashboard(raw = {}) {
  const base = emptyDashboard();
  const orders = raw.orders || {};
  const pos = raw.pos || {};
  const invoices = raw.invoices || {};
  const invoiceStats = invoices.stats || {};
  const credits = raw.credits || {};
  const comparison = raw.comparison || {};
  const revenueBreakdown = raw.revenueBreakdown || {};
  const summary = raw.summary || {};

  return {
    ...base,
    ...raw,
    summary: {
      ...base.summary,
      ...summary,
      totalRevenue: toNum(summary.totalRevenue),
      totalPosSales: toNum(summary.totalPosSales ?? pos.count),
      totalPosRevenue: toNum(summary.totalPosRevenue ?? pos.revenue),
    },
    orders: {
      ...base.orders,
      ...orders,
      count: toNum(orders.count),
      revenue: toNum(orders.revenue),
      todayCount: toNum(orders.todayCount),
      todayRevenue: toNum(orders.todayRevenue),
      pendingCount: toNum(orders.pendingCount),
      revenueGrowth: orders.revenueGrowth?.toString() || '+0%',
      byStatus: Array.isArray(orders.byStatus)
        ? orders.byStatus.map((s) => ({
            status: s.status?.toString() || '',
            count: toNum(s.count),
            revenue: toNum(s.revenue),
          }))
        : [],
      trend: Array.isArray(orders.trend)
        ? orders.trend.map((t) => ({
            date: t.date?.toString() || '',
            // Backend uses `revenue`; Flutter model expects `orderRevenue`
            orderRevenue: toNum(t.orderRevenue ?? t.revenue),
            revenue: toNum(t.revenue),
            orders: toNum(t.orders),
            count: toNum(t.count ?? t.orders),
          }))
        : [],
    },
    pos: {
      ...base.pos,
      ...pos,
      count: toNum(pos.count),
      revenue: toNum(pos.revenue),
      discountTotal: toNum(pos.discountTotal),
      taxTotal: toNum(pos.taxTotal),
      paidAmount: toNum(pos.paidAmount),
      todayCount: toNum(pos.todayCount),
      todayRevenue: toNum(pos.todayRevenue),
      revenueGrowth: pos.revenueGrowth?.toString() || '+0%',
      trend: Array.isArray(pos.trend)
        ? pos.trend.map((t) => ({
            date: t.date?.toString() || '',
            sales: toNum(t.sales),
            revenue: toNum(t.revenue),
          }))
        : [],
    },
    invoices: {
      ...base.invoices,
      ...invoices,
      stats: {
        ...base.invoices.stats,
        ...invoiceStats,
        grandTotal: toNum(invoiceStats.grandTotal ?? invoiceStats.revenue),
        revenue: toNum(invoiceStats.revenue ?? invoiceStats.grandTotal),
        paidAmount: toNum(invoiceStats.paidAmount),
        outstanding: toNum(invoiceStats.outstanding),
        total: toNum(invoiceStats.total),
      },
      trend: Array.isArray(invoices.trend)
        ? invoices.trend.map((t) => ({
            date: t.date?.toString() || '',
            revenue: toNum(t.revenue),
            collected: toNum(t.collected),
            count: toNum(t.count),
          }))
        : [],
      grandTotalGrowth: invoices.grandTotalGrowth?.toString() || '+0%',
      paidAmountGrowth: invoices.paidAmountGrowth?.toString() || '+0%',
      outstandingGrowth: invoices.outstandingGrowth?.toString() || '+0%',
    },
    credits: {
      total: toNum(credits.total),
      creditAmount: toNum(credits.creditAmount),
      remainingAmount: toNum(credits.remainingAmount),
      appliedAmount: toNum(credits.appliedAmount),
      issued: toNum(credits.issued),
      partiallyApplied: toNum(credits.partiallyApplied),
      fullyApplied: toNum(credits.fullyApplied),
    },
    comparison: {
      today: { ...defaultComparison(), ...(comparison.today || {}) },
      week: { ...defaultComparison(), ...(comparison.week || {}) },
      month: { ...defaultComparison(), ...(comparison.month || {}) },
      year: { ...defaultComparison(), ...(comparison.year || {}) },
    },
    recentActivity: Array.isArray(raw.recentActivity)
      ? raw.recentActivity.map((a) => ({
          id: a.id?.toString() || '',
          type: a.type?.toString() || 'order',
          description: a.description?.toString() || '',
          amount: toNum(a.amount),
          date: a.date,
          status: a.status?.toString() || '',
          timestamp: a.timestamp?.toString() || '',
        }))
      : [],
    // Backend: productName/quantity — Flutter: name/quantitySold
    topProducts: Array.isArray(raw.topProducts)
      ? raw.topProducts.map((p) => ({
          id: (p.id ?? p.productId)?.toString() || '',
          name: (p.name ?? p.productName)?.toString() || 'Unknown',
          sku: p.sku?.toString() || '',
          quantitySold: toNum(p.quantitySold ?? p.quantity),
          revenue: toNum(p.revenue),
          discountAmount: toNum(p.discountAmount),
        }))
      : [],
    // Backend: totalOrders — Flutter: orderCount
    topCustomers: Array.isArray(raw.topCustomers)
      ? raw.topCustomers.map((c) => ({
          id: c.id?.toString() || '',
          name: c.name?.toString() || 'Unknown',
          email: c.email?.toString() || '',
          phone: c.phone?.toString() || '',
          orderCount: toNum(c.orderCount ?? c.totalOrders),
          totalSpent: toNum(c.totalSpent),
          totalDiscount: toNum(c.totalDiscount),
        }))
      : [],
    revenueBreakdown: {
      ...base.revenueBreakdown,
      ...revenueBreakdown,
      grossRevenue: toNum(revenueBreakdown.grossRevenue),
      lineItemDiscounts: toNum(revenueBreakdown.lineItemDiscounts),
      orderLevelDiscounts: toNum(revenueBreakdown.orderLevelDiscounts),
      netRevenue: toNum(revenueBreakdown.netRevenue),
      taxAmount: toNum(revenueBreakdown.taxAmount),
      shippingAmount: toNum(revenueBreakdown.shippingAmount),
      items: Array.isArray(revenueBreakdown.items)
        ? revenueBreakdown.items.map((i) => ({
            category: i.category?.toString() || '',
            amount: toNum(i.amount),
            percentage: toNum(i.percentage),
          }))
        : [],
    },
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const fiscalYearId = searchParams.get('fiscalYearId');
    const locationId = searchParams.get('locationId');

    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const qs = new URLSearchParams({ period });
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    if (fiscalYearId) qs.set('fiscalYearId', fiscalYearId);
    if (locationId) qs.set('locationId', locationId);

    const response = await fetch(
      `${API_BASE_URL}/api/warehouse/sales/dashboard?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Backend error',
          data: emptyDashboard(),
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const payload = result?.data ?? result;

    return NextResponse.json({
      success: true,
      data: normalizeDashboard(payload),
    });
  } catch (error) {
    console.error('GET /api/sales/dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', data: emptyDashboard() },
      { status: 500 }
    );
  }
}
