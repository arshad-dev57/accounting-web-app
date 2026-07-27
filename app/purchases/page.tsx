'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  Truck, 
  Receipt, 
  ArrowLeftRight, 
  Undo2, 
  DollarSign,
  RefreshCw,
  FileText as QuotationIcon,
  PackageCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function PurchasesPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const periods = ['today', 'week', 'month', 'year'];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Simulating API call - replace with actual purchases API
      const response = await fetch(`/api/purchases/dashboard?period=${selectedPeriod}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        // Set default data if API doesn't exist yet
        setDashboardData({
          orders: { revenue: 0, count: 0 },
          invoices: { grandTotal: 0, paidAmount: 0, outstanding: 0, total: 0 },
          comparison: {
            today: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
            week: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
            month: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
            year: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
          },
          recentActivity: [],
          topProducts: [],
          topSuppliers: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default data on error
      setDashboardData({
        orders: { revenue: 0, count: 0 },
        invoices: { grandTotal: 0, paidAmount: 0, outstanding: 0, total: 0 },
        comparison: {
          today: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
          week: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
          month: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
          year: { currentSales: 0, currentReturns: 0, salesChangePercent: 0, returnsChangePercent: 0 },
        },
        recentActivity: [],
        topProducts: [],
        topSuppliers: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'received':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'ordered':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase':
      case 'order':
        return ShoppingCart;
      case 'return':
        return Undo2;
      case 'payment':
        return DollarSign;
      case 'receipt':
        return Receipt;
      default:
        return FileText;
    }
  };

  const comparisonData = dashboardData?.comparison || {};
  const kpiData = dashboardData || {};
  const recentActivity = dashboardData?.recentActivity || [];
  const topProducts = dashboardData?.topProducts || [];
  const topSuppliers = dashboardData?.topSuppliers || [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Period Chips */}
          <div className="flex gap-2">
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period
                          ? 'bg-[#00E676] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                  <button 
                    onClick={fetchDashboardData}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Purchase Orders', value: formatCurrency(kpiData.orders?.revenue || 0), icon: ShoppingCart, color: 'indigo' },
                    { label: 'Receipts Total', value: formatCurrency(kpiData.invoices?.grandTotal || 0), icon: Receipt, color: 'teal' },
                    { label: 'Paid', value: formatCurrency(kpiData.invoices?.paidAmount || 0), icon: DollarSign, color: 'green' },
                    { label: 'Payable', value: formatCurrency(kpiData.invoices?.outstanding || 0), icon: FileText, color: 'orange' },
                    { label: 'Orders', value: kpiData.orders?.count?.toString() || '0', icon: ShoppingCart, color: 'blue' },
                    { label: 'Receipts', value: kpiData.invoices?.total?.toString() || '0', icon: Receipt, color: 'purple' },
                  ].map((kpi, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl bg-${kpi.color}-50`}>
                          <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 mt-3">{kpi.value}</p>
                      <p className="text-sm text-gray-500">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Today vs Yesterday', data: comparisonData.today },
                    { title: 'This Week vs Last Week', data: comparisonData.week },
                    { title: 'This Month vs Last Month', data: comparisonData.month },
                    { title: 'This Year vs Last Year', data: comparisonData.year },
                  ].map((card, index) => (
                    <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 mb-3">{card.title}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Purchases</span>
                          <span className="text-lg font-bold text-gray-800">{formatCurrency(card.data?.currentSales || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Returns</span>
                          <span className="text-lg font-bold text-gray-800">{formatCurrency(card.data?.currentReturns || 0)}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            card.data?.salesChangePercent >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {card.data?.salesChangePercent >= 0 ? '+' : ''}{card.data?.salesChangePercent?.toFixed(1) || 0}% purchases
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            card.data?.returnsChangePercent >= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {card.data?.returnsChangePercent >= 0 ? '+' : ''}{card.data?.returnsChangePercent?.toFixed(1) || 0}% returns
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payables & Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#00E676]" />
                      Recent Activity
                    </h2>
                    <span className="text-xs text-gray-400">Last 30 days</span>
                  </div>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No recent activity</div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity: any, index: number) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                              <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(activity.amount)}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button 
                    onClick={() => router.push('/purchases/purchaseorder')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-indigo-50 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Purchase Orders</p>
                      <p className="text-xs text-gray-500">Manage orders</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/purchases/receipts')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-teal-50 rounded-lg">
                      <Receipt className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Goods Receipts</p>
                      <p className="text-xs text-gray-500">View receipts</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/purchases/quotations')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-[#00E676]/10 rounded-lg">
                      <QuotationIcon className="w-4 h-4 text-[#00E676]" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Quotations</p>
                      <p className="text-xs text-gray-500">Manage quotes</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/purchases/returns')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-orange-50 rounded-lg">
                      <Undo2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Purchase Returns</p>
                      <p className="text-xs text-gray-500">Process returns</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => router.push('/purchases/payments')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-red-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Payments</p>
                      <p className="text-xs text-gray-500">Handle payments</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => router.push('/purchases/goodsRecieving')}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                      <PackageCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">Goods Receiving</p>
                      <p className="text-xs text-gray-500">Receive goods</p>
                    </div>
                  </button>
                </div>

                {/* Top Products & Suppliers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Products */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#00E676]" />
                        Top Purchased Products
                      </h2>
                    </div>
                    {topProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No products data</div>
                    ) : (
                      <div className="space-y-3">
                        {topProducts.slice(0, 5).map((product: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#00E676]/10 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-[#00E676]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.quantitySold} purchased</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{formatCurrency(product.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Suppliers */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#00E676]" />
                        Top Suppliers
                      </h2>
                    </div>
                    {topSuppliers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No suppliers data</div>
                    ) : (
                      <div className="space-y-3">
                        {topSuppliers.slice(0, 5).map((supplier: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{supplier.name}</p>
                                <p className="text-xs text-gray-500">{supplier.orderCount} orders</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{formatCurrency(supplier.totalSpent)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
        </>
      )}
    </div>
  );
}
