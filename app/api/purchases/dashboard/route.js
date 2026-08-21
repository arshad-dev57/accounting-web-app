// app/api/purchases/dashboard/route.js
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyDashboard() {
  return {
    orders: {
      total: 0,
      approved: 0,
      approvedValue: 0,
      draft: 0,
      sent: 0,
      received: 0,
      cancelled: 0,
    },
    invoices: {
      total: 0,
      paid: 0,
      paidAmount: 0,
      outstanding: 0,
      totalSpend: 0,
      grossSpend: 0,
    },
    returns: { total: 0, amount: 0 },
    payments: { totalPaid: 0 },
    spendTrend: [],
    orderStatuses: [],
    topSuppliers: [],
    activities: [],
  };
}

async function fetchBackend(path, token, qs) {
  const response = await fetch(`${API_BASE_URL}${path}?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend error (${response.status})`);
  }

  return response.json();
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

    // Same parallel fetches as Flutter PurchaseController
    const [metricsRes, trendRes, statusRes, suppliersRes, activitiesRes] =
      await Promise.allSettled([
        fetchBackend('/api/purchase/dashboard/metrics', token, qs),
        fetchBackend('/api/purchase/dashboard/charts/spend-trend', token, qs),
        fetchBackend('/api/purchase/dashboard/charts/order-status', token, qs),
        fetchBackend('/api/purchase/dashboard/charts/top-suppliers', token, qs),
        fetchBackend('/api/purchase/dashboard/activities', token, qs),
      ]);

    const base = emptyDashboard();
    const metrics =
      metricsRes.status === 'fulfilled'
        ? metricsRes.value?.data || {}
        : {};

    const spendTrend =
      trendRes.status === 'fulfilled' && Array.isArray(trendRes.value?.data)
        ? trendRes.value.data.map((p) => ({
            date: p.date?.toString() || '',
            label: p.label?.toString() || '',
            invoiceAmount: toNum(p.invoiceAmount),
            paidAmount: toNum(p.paidAmount),
            orderValue: toNum(p.orderValue),
          }))
        : [];

    const orderStatuses =
      statusRes.status === 'fulfilled' && Array.isArray(statusRes.value?.data)
        ? statusRes.value.data.map((s) => ({
            status: s.status?.toString() || '',
            count: toNum(s.count),
            value: toNum(s.value),
            color: s.color?.toString() || '#00E676',
          }))
        : [];

    const topSuppliers =
      suppliersRes.status === 'fulfilled' &&
      Array.isArray(suppliersRes.value?.data)
        ? suppliersRes.value.data.map((s) => ({
            supplierName: s.supplierName?.toString() || 'Unknown',
            totalOrders: toNum(s.totalOrders),
            totalValue: toNum(s.totalValue),
            color: s.color?.toString() || '#00E676',
          }))
        : [];

    const activitiesRaw =
      activitiesRes.status === 'fulfilled'
        ? activitiesRes.value?.data?.activities ??
          activitiesRes.value?.data ??
          []
        : [];

    const activities = Array.isArray(activitiesRaw)
      ? activitiesRaw.map((a) => ({
          id: a.id?.toString() || '',
          type: a.type?.toString() || '',
          action: a.action?.toString() || '',
          details: a.details?.toString() || '',
          amount: toNum(a.amount),
          createdAt: a.createdAt?.toString() || '',
        }))
      : [];

    const orders = metrics.orders || {};
    const invoices = metrics.invoices || {};
    const returns = metrics.returns || {};
    const payments = metrics.payments || {};

    return NextResponse.json({
      success: true,
      data: {
        ...base,
        orders: {
          total: toNum(orders.total),
          approved: toNum(orders.approved),
          approvedValue: toNum(orders.approvedValue),
          draft: toNum(orders.draft),
          sent: toNum(orders.sent),
          received: toNum(orders.received),
          cancelled: toNum(orders.cancelled),
        },
        invoices: {
          total: toNum(invoices.total),
          paid: toNum(invoices.paid),
          paidAmount: toNum(invoices.paidAmount),
          outstanding: toNum(invoices.outstanding),
          totalSpend: toNum(invoices.totalSpend),
          grossSpend: toNum(invoices.grossSpend),
        },
        returns: {
          total: toNum(returns.total),
          amount: toNum(returns.amount),
        },
        payments: {
          totalPaid: toNum(payments.totalPaid),
        },
        spendTrend,
        orderStatuses,
        topSuppliers,
        activities,
      },
    });
  } catch (error) {
    console.error('GET /api/purchases/dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', data: emptyDashboard() },
      { status: 500 }
    );
  }
}
