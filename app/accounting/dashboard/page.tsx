'use client';

import { useState, useEffect } from 'react';
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
  Plus,
  Loader2
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
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/summary?timePeriod=This Month');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError('Error fetching stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gray-100 animate-pulse">
                <div className="w-5 h-5 bg-gray-300 rounded" />
              </div>
              <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-gray-100 rounded mt-3 animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
        {error || 'Failed to load dashboard stats'}
      </div>
    );
  }

  const statCards = [
    { 
      icon: DollarSign, 
      label: 'Total Revenue', 
      value: stats.kpi.totalRevenue.formatted, 
      color: 'green', 
      change: `${stats.kpi.totalRevenue.isPositive ? '+' : ''}${stats.kpi.totalRevenue.change}%`,
      isPositive: stats.kpi.totalRevenue.isPositive
    },
    { 
      icon: TrendingDown, 
      label: 'Total Expenses', 
      value: stats.kpi.totalExpenses.formatted, 
      color: 'red', 
      change: `${stats.kpi.totalExpenses.isPositive ? '-' : '+'}${stats.kpi.totalExpenses.change}%`,
      isPositive: stats.kpi.totalExpenses.isPositive
    },
    { 
      icon: Receipt, 
      label: 'Outstanding', 
      value: stats.kpi.outstanding.formatted, 
      color: 'purple', 
      change: `${stats.kpi.outstanding.count} invoices`,
      isPositive: true
    },
    { 
      icon: TrendingUp, 
      label: 'Cash Balance', 
      value: stats.kpi.cashBalance.formatted, 
      color: 'blue', 
      change: `${stats.kpi.cashBalance.isPositive ? '+' : ''}${stats.kpi.cashBalance.change}%`,
      isPositive: stats.kpi.cashBalance.isPositive
    },
  ];

  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
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
                stat.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/recent-transactions?limit=5');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
      } else {
        setError(data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Error fetching transactions');
      console.error('Error fetching recent transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  // Filter only income transactions (invoices, payments, income)
  const incomeTransactions = transactions.filter(t => t.type === 'income').slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1088dd]" />
          Recent Transactions
        </h2>
        <button className="text-sm text-[#1088dd] font-semibold hover:text-[#091746]">
          View All →
        </button>
      </div>
      {incomeTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recent transactions found
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 text-xs font-semibold text-gray-500">Reference</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500">Description</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500">Amount</th>
              <th className="text-left py-3 text-xs font-semibold text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {incomeTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 text-gray-600 font-medium">
                  {transaction.reference || transaction.invoiceNumber || '-'}
                </td>
                <td className="py-3 text-gray-600">{transaction.title}</td>
                <td className="py-3 font-semibold text-gray-700">
                  ${transaction.amount?.toFixed(2) || '0.00'}
                </td>
                <td className="py-3 text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// MAIN ACCOUNTING DASHBOARD
// ============================================================
export default function AccountingDashboard() {
  return (
    <div className="space-y-6">
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
  );
}