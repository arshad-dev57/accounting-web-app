'use client';

import { useState } from 'react';
import { 
  Home, 
  Warehouse, 
  Building2, 
  HelpCircle,
  ChevronRight,
  LogOut,
  Phone,
  Headset,
  ChevronDown,
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ activeIndex: propActiveIndex }: { activeIndex?: number }) {
  const [activeIndex, setActiveIndex] = useState(propActiveIndex || 1);

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Accounting', path: '/accounting/dashboard' },
    { icon: <Warehouse className="w-5 h-5" />, label: 'Warehouse', path: '/warehouse/dashboard' },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-[#7c4dff] rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">W</span>
        </div>
        <span className="text-lg font-extrabold tracking-wider">WarehousePro</span>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          MAIN MENU
        </p>
        
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${activeIndex === index 
                ? 'bg-[#7c4dff]/20 text-[#b388ff]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeIndex === index ? 'text-[#b388ff]' : 'text-white/40'}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {activeIndex === index && (
              <ChevronRight className="w-4 h-4 text-[#b388ff]" />
            )}
          </button>
        ))}
      </div>

      <div className="px-3 pb-6">
        <div className="p-4 bg-[#7c4dff]/10 rounded-xl border border-[#7c4dff]/20">
          <HelpCircle className="w-5 h-5 text-[#b388ff] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40">Contact our support team</p>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ACCOUNTING STATS
// ============================================================
function AccountingStats() {
  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: '$124,500', color: 'green', change: '+23%' },
    { icon: TrendingUp, label: 'Total Income', value: '$45,200', color: 'blue', change: '+15%' },
    { icon: TrendingDown, label: 'Total Expenses', value: '$18,700', color: 'red', change: '-8%' },
    { icon: Receipt, label: 'Total Invoices', value: '234', color: 'purple', change: '+12%' },
  ];

  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
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
// RECENT INVOICES
// ============================================================
function RecentInvoices() {
  const invoices = [
    { id: 'INV-001', customer: 'John Doe', amount: '$499.00', date: '2026-06-23', status: 'Paid' },
    { id: 'INV-002', customer: 'Jane Smith', amount: '$999.00', date: '2026-06-22', status: 'Pending' },
    { id: 'INV-003', customer: 'Mike Johnson', amount: '$1,299.00', date: '2026-06-21', status: 'Overdue' },
    { id: 'INV-004', customer: 'Sarah Wilson', amount: '$749.00', date: '2026-06-20', status: 'Paid' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#7c4dff]" />
          Recent Invoices
        </h2>
        <button className="text-sm text-[#7c4dff] font-semibold hover:text-[#6c3fe0]">
          View All →
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 text-xs font-semibold text-gray-500">Invoice #</th>
            <th className="text-left py-3 text-xs font-semibold text-gray-500">Customer</th>
            <th className="text-left py-3 text-xs font-semibold text-gray-500">Amount</th>
            <th className="text-left py-3 text-xs font-semibold text-gray-500">Date</th>
            <th className="text-left py-3 text-xs font-semibold text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 text-gray-600 font-medium">{invoice.id}</td>
              <td className="py-3 text-gray-600">{invoice.customer}</td>
              <td className="py-3 font-semibold text-gray-700">{invoice.amount}</td>
              <td className="py-3 text-gray-500">{invoice.date}</td>
              <td className="py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {invoice.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// MAIN ACCOUNTING DASHBOARD
// ============================================================
export default function AccountingDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeIndex={1} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#7c4dff]" />
              Accounting Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
              <Headset className="w-4 h-4" />
              <span>Support</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#7c4dff]" />
              <span>Call Us: 03 111 006 555</span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-8 h-8 bg-[#7c4dff] rounded-full flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <AccountingStats />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">New Invoice</p>
                  <p className="text-xs text-gray-500">Create invoice</p>
                </div>
              </button>
              
              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">Record Payment</p>
                  <p className="text-xs text-gray-500">Track payments</p>
                </div>
              </button>
              
              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">Expense Report</p>
                  <p className="text-xs text-gray-500">Track expenses</p>
                </div>
              </button>

              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">Reports</p>
                  <p className="text-xs text-gray-500">Financial reports</p>
                </div>
              </button>
            </div>

            {/* Recent Invoices */}
            <RecentInvoices />
          </div>
        </div>
      </div>
    </div>
  );
}