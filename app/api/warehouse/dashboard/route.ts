import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://account-backend-five.vercel.app').trim();

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
      inStockCount: 0,
      todayStockIn: 0,
      todayStockOut: 0,
      periodStockIn: 0,
      periodStockOut: 0,
      pendingOrders: 0,
      todayRevenue: 0,
      inventoryHealthScore: 100,
      stockAvailabilityRate: 100,
      warehouseBreakdown: [] as Array<{
        locationId: string;
        name: string;
        code: string;
        productCount: number;
        stockValue: number;
        lowStockCount: number;
        outOfStockCount: number;
        quantityOnHand: number;
      }>,
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

async function fetchBackend(
  path: string,
  token: string,
  qs: URLSearchParams,
  extraHeaders: Record<string, string> = {}
) {
  const url = qs.toString() ? `${API_BASE_URL}${path}?${qs}` : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
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

    const companyId =
      request.headers.get('x-company-id') ||
      request.cookies.get('active_company_id')?.value ||
      '';
    const companyHeaders: Record<string, string> = {};
    if (companyId) {
      try {
        companyHeaders['X-Company-Id'] = decodeURIComponent(companyId);
      } catch {
        companyHeaders['X-Company-Id'] = companyId;
      }
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
      fetchBackend('/api/warehouse/dashboard/metrics', token, qs, companyHeaders),
      fetchBackend('/api/warehouse/dashboard/activities', token, emptyQs, companyHeaders),
      fetchBackend('/api/warehouse/dashboard/charts/stock-movement', token, qs, companyHeaders),
      fetchBackend('/api/warehouse/dashboard/charts/categories', token, emptyQs, companyHeaders),
      fetchBackend('/api/warehouse/dashboard/charts/top-products', token, emptyQs, companyHeaders),
      fetchBackend('/api/warehouse/dashboard/charts/order-status', token, emptyQs, companyHeaders),
    ]);

    const base = emptyDashboard();

    if (metricsRes.status === 'fulfilled') {
      const m = metricsRes.value?.data || {};
      const breakdown = Array.isArray(m.warehouseBreakdown) ? m.warehouseBreakdown : [];
      base.metrics = {
        totalProducts: toNum(m.totalProducts),
        totalStockValue: toNum(m.totalStockValue),
        lowStockCount: toNum(m.lowStockCount),
        outOfStockCount: toNum(m.outOfStockCount),
        overstockCount: toNum(m.overstockCount),
        expiringCount: toNum(m.expiringCount),
        inStockCount: toNum(m.inStockCount ?? Math.max(0, toNum(m.totalProducts) - toNum(m.outOfStockCount))),
        todayStockIn: toNum(m.todayStockIn),
        todayStockOut: toNum(m.todayStockOut),
        periodStockIn: toNum(m.periodStockIn),
        periodStockOut: toNum(m.periodStockOut),
        pendingOrders: toNum(m.pendingOrders),
        todayRevenue: toNum(m.todayRevenue),
        inventoryHealthScore: toNum(m.inventoryHealthScore ?? 100),
        stockAvailabilityRate: toNum(m.stockAvailabilityRate ?? 100),
        warehouseBreakdown: breakdown.map((row: Record<string, unknown>) => ({
          locationId: String(row.locationId ?? ''),
          name: String(row.name ?? ''),
          code: String(row.code ?? ''),
          productCount: toNum(row.productCount),
          stockValue: toNum(row.stockValue),
          lowStockCount: toNum(row.lowStockCount),
          outOfStockCount: toNum(row.outOfStockCount),
          quantityOnHand: toNum(row.quantityOnHand),
        })),
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
