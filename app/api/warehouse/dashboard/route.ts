import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').trim();

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyDashboard() {
  return {
    metrics: {
      totalProducts: 0,
      totalStockValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      overstockCount: 0,
      expiringCount: 0,
      todayStockIn: 0,
      todayStockOut: 0,
      periodStockIn: 0,
      periodStockOut: 0,
      pendingOrders: 0,
      todayRevenue: 0,
    },
    stockMovement: [] as Array<{
      label: string;
      stockIn: number;
      stockOut: number;
      date: string;
    }>,
    categories: [] as Array<{
      categoryName: string;
      productCount: number;
      percentage: number;
      color: string;
    }>,
    topProducts: [] as Array<{ label: string; value: number; color: string }>,
    orderStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    },
    activities: [] as Array<{
      id: string;
      user: string;
      action: string;
      details: string;
      createdAt: string;
    }>,
  };
}

async function fetchBackend(path: string, token: string, qs: URLSearchParams) {
  const url = qs.toString() ? `${API_BASE_URL}${path}?${qs}` : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend error (${response.status})`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', data: emptyDashboard() },
        { status: 401 }
      );
    }

    const qs = new URLSearchParams({ period });
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const locationId = searchParams.get('locationId');
    if (locationId) qs.set('locationId', locationId);
    const emptyQs = new URLSearchParams();
    if (locationId) emptyQs.set('locationId', locationId);

    // Same parallel fetches as Flutter WarehouseDashboardController
    const [
      metricsRes,
      activitiesRes,
      movementRes,
      categoriesRes,
      topProductsRes,
      orderStatusRes,
    ] = await Promise.allSettled([
      fetchBackend('/api/warehouse/dashboard/metrics', token, qs),
      fetchBackend('/api/warehouse/dashboard/activities', token, emptyQs),
      fetchBackend('/api/warehouse/dashboard/charts/stock-movement', token, qs),
      fetchBackend('/api/warehouse/dashboard/charts/categories', token, emptyQs),
      fetchBackend('/api/warehouse/dashboard/charts/top-products', token, emptyQs),
      fetchBackend('/api/warehouse/dashboard/charts/order-status', token, emptyQs),
    ]);

    const base = emptyDashboard();

    if (metricsRes.status === 'fulfilled') {
      const m = metricsRes.value?.data || {};
      base.metrics = {
        totalProducts: toNum(m.totalProducts),
        totalStockValue: toNum(m.totalStockValue),
        lowStockCount: toNum(m.lowStockCount),
        outOfStockCount: toNum(m.outOfStockCount),
        overstockCount: toNum(m.overstockCount),
        expiringCount: toNum(m.expiringCount),
        todayStockIn: toNum(m.todayStockIn),
        todayStockOut: toNum(m.todayStockOut),
        periodStockIn: toNum(m.periodStockIn),
        periodStockOut: toNum(m.periodStockOut),
        pendingOrders: toNum(m.pendingOrders),
        todayRevenue: toNum(m.todayRevenue),
      };
    }

    if (activitiesRes.status === 'fulfilled') {
      const list = activitiesRes.value?.data?.activities || [];
      base.activities = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => {
        const userObj = item.user as Record<string, unknown> | undefined;
        return {
          id: String(item.id ?? item._id ?? ''),
          user: String(userObj?.name ?? item.userName ?? 'Unknown'),
          action: String(item.action ?? ''),
          details: String(item.details ?? ''),
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        };
      });
    }

    if (movementRes.status === 'fulfilled') {
      const list = movementRes.value?.data || [];
      base.stockMovement = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
        label: String(item.label ?? ''),
        stockIn: toNum(item.stockIn),
        stockOut: toNum(item.stockOut),
        date: String(item.date ?? ''),
      }));
    }

    if (categoriesRes.status === 'fulfilled') {
      const list = categoriesRes.value?.data?.categories || [];
      base.categories = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
        categoryName: String(item.categoryName ?? 'Unknown'),
        productCount: toNum(item.productCount),
        percentage: toNum(item.percentage),
        color: String(item.color ?? '#2196F3'),
      }));
    }

    if (topProductsRes.status === 'fulfilled') {
      const list = topProductsRes.value?.data || [];
      base.topProducts = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
        label: String(item.label ?? 'Product'),
        value: toNum(item.value),
        color: String(item.color ?? '#2196F3'),
      }));
    }

    if (orderStatusRes.status === 'fulfilled') {
      const d = orderStatusRes.value?.data || {};
      base.orderStatus = {
        pending: toNum(d.pending),
        processing: toNum(d.processing),
        shipped: toNum(d.shipped),
        completed: toNum(d.completed),
        cancelled: toNum(d.cancelled),
      };
    }

    return NextResponse.json({ success: true, data: base });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load warehouse dashboard';
    console.error('❌ [Warehouse Dashboard API]', message);
    return NextResponse.json(
      { success: false, message, data: emptyDashboard() },
      { status: 500 }
    );
  }
}
