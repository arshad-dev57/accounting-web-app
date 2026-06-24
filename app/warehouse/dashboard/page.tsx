'use client';

import { Package, Boxes, Truck, ClipboardList, TrendingUp, AlertCircle, Eye, Plus, Users } from 'lucide-react';
import Link from 'next/link';

// ============================================================
// WAREHOUSE STATS
// ============================================================
function WarehouseStats() {
  const stats = [
    { icon: Package, label: 'Total Products', value: '2,847', color: 'blue', change: '+12%' },
    { icon: Boxes, label: 'Total Stock', value: '12,456', color: 'green', change: '+8%' },
    { icon: Truck, label: 'Orders Today', value: '89', color: 'purple', change: '+23%' },
    { icon: ClipboardList, label: 'Pending Orders', value: '23', color: 'orange', change: '-5%' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${colorMap[stat.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-3">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LOW STOCK ALERTS
// ============================================================
function LowStockAlerts() {
  const lowStockItems = [
    { product: 'Samsung A54', current: 5, min: 10, location: 'A-12' },
    { product: 'iPhone 15 Pro', current: 3, min: 8, location: 'B-05' },
    { product: 'Dell XPS 15', current: 2, min: 6, location: 'C-08' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Low Stock Alerts
        </h2>
        <Link href="/warehouse/products" className="text-sm text-[#7c4dff] font-semibold hover:text-[#6c3fe0]">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {lowStockItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-gray-800">{item.product}</p>
              <p className="text-xs text-gray-500">Location: {item.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-600">{item.current} / {item.min}</p>
              <p className="text-xs text-gray-500">Current / Min</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// RECENT STOCK MOVEMENTS
// ============================================================
function StockMovements() {
  const movements = [
    { id: 'SM-001', product: 'Samsung A54', type: 'IN', quantity: 50, date: '2026-06-23', status: 'Completed' },
    { id: 'SM-002', product: 'iPhone 15 Pro', type: 'OUT', quantity: 12, date: '2026-06-23', status: 'Completed' },
    { id: 'SM-003', product: 'Dell XPS 15', type: 'IN', quantity: 30, date: '2026-06-22', status: 'Pending' },
    { id: 'SM-004', product: 'Samsung A54', type: 'OUT', quantity: 5, date: '2026-06-22', status: 'Completed' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#7c4dff]" />
          Recent Stock Movements
        </h2>
        <button className="text-sm text-[#7c4dff] font-semibold hover:text-[#6c3fe0]">
          View All →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Movement ID</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 text-gray-600 font-medium">{movement.id}</td>
                <td className="py-3 text-gray-600">{movement.product}</td>
                <td className="py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    movement.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {movement.type}
                  </span>
                </td>
                <td className="py-3 font-semibold text-gray-700">{movement.quantity}</td>
                <td className="py-3 text-gray-500">{movement.date}</td>
                <td className="py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    movement.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {movement.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// MAIN WAREHOUSE DASHBOARD
// ============================================================
export default function WarehouseDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <WarehouseStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link 
          href="/warehouse/products" 
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c4dff] transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-all">
            <Plus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Add Product</p>
            <p className="text-xs text-gray-500">New inventory</p>
          </div>
        </Link>
        
        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c4dff] transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-all">
            <Truck className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Receive Stock</p>
            <p className="text-xs text-gray-500">Incoming stock</p>
          </div>
        </button>
        
        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c4dff] transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-all">
            <ClipboardList className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Stock Audit</p>
            <p className="text-xs text-gray-500">Verify inventory</p>
          </div>
        </button>

        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c4dff] transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-all">
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">View Reports</p>
            <p className="text-xs text-gray-500">Analytics</p>
          </div>
        </button>

        <Link 
          href="/warehouse/suppliers" 
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c4dff] transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-all">
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Suppliers</p>
            <p className="text-xs text-gray-500">Manage suppliers</p>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StockMovements />
        </div>
        <div>
          <LowStockAlerts />
        </div>
      </div>
    </div>
  );
}