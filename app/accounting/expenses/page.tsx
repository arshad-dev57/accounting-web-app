'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, TrendingDown, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText,
  RefreshCw, Trash2, Building2, CalendarDays,
  Receipt, Wallet, ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown, CreditCard as CreditCardIcon,
  Send, Save, Printer, Download, Landmark,
  ReceiptText, ReceiptIndianRupee, ShoppingCart,
  User, Phone, Mail, Building, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit, Archive, MoreVertical, Info, Layers,
  BookOpen, FileSpreadsheet, FileText as FileTextIcon,
  PlusCircle, MinusCircle, List, Scale,
  Filter as FilterIcon, Calendar as CalendarIcon,
  Download as DownloadIcon, Printer as PrinterIcon,
  Eye as EyeIcon, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon,
  History, Building as BuildingIcon, Hash,
  Banknote as BanknoteIcon, CreditCard, Handshake, Home, ShoppingBag,
  Receipt as ReceiptIcon, Briefcase, DollarSign as DollarSignIcon,
  Home as HomeIcon, Bolt, Users as UsersIcon, Megaphone, Package, Plane, Utensils,
  Shield as Security, Wrench as Build, Monitor as Computer, Receipt as ReceiptIcon2
} from 'lucide-react';
import { expenseService, Expense, ExpenseStats, ExpenseAccount, Vendor, BankAccount } from '../../api/expenses/route';
import TaxRateSelect from '../../../components/TaxRateSelect';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  expenseType: string;
  startDate: string;
  endDate: string;
}

interface ExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<ExpenseStats>({
    totalExpense: 0,
    totalTax: 0,
    totalCount: 0,
    thisMonth: 0,
    thisWeek: 0,
    byType: {}
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    expenseType: 'All',
    startDate: '',
    endDate: ''
  });
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Draft', 'Posted', 'Cancelled'];
  const expenseTypeOptions = ['All', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Office Supplies', 'Travel', 'Meals', 'Insurance', 'Maintenance', 'Software', 'Taxes', 'Other'];
  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card'];

  // ─── Get Currency Symbol from Local Storage ──────────────────

  const getCurrencySymbol = () => {
    try {
      const saved = localStorage.getItem('sales_selected_currency');
      if (saved) {
        const currency = JSON.parse(saved);
        return currency.symbol || 'Rs.';
      }
    } catch (e) {
      console.error('Error getting currency:', e);
    }
    return 'Rs.';
  };

  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol());
  }, []);

  // ─── Fetch Dropdown Data ─────────────────────────────────────

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsRes, vendorsRes, bankRes] = await Promise.all([
        expenseService.getExpenseAccounts(),
        expenseService.getVendors(),
        expenseService.getBankAccounts()
      ]);
      setExpenseAccounts(accountsRes || []);
      setVendors(vendorsRes || []);
      setBankAccounts(bankRes || []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }, []);

  // ─── Fetch Expenses ──────────────────────────────────────────

  const fetchExpenses = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await expenseService.getExpenses({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined,
        expenseType: filter.expenseType !== 'All' ? filter.expenseType : undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined
      });

      setExpenses(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch expenses:', error);
      alert(error.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await expenseService.getExpenses({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined,
        expenseType: filter.expenseType !== 'All' ? filter.expenseType : undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined
      });

      setExpenses(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more expenses:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchDropdownData();
    fetchExpenses(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchExpenses(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchExpenses(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchExpenses(true);
  };

  const handleTypeChange = (type: string) => {
    setFilter(prev => ({ ...prev, expenseType: type }));
    fetchExpenses(true);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setFilter(prev => ({ ...prev, startDate: start, endDate: end }));
    fetchExpenses(true);
  };

  const clearDateRange = () => {
    setFilter(prev => ({ ...prev, startDate: '', endDate: '' }));
    fetchExpenses(true);
  };

  const handleRefresh = () => {
    fetchExpenses(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchExpenses(false);
  };

  // ─── Create Expense ─────────────────────────────────────────

  const handleCreateExpense = async (data: any) => {
    setSubmitting(true);
    try {
      await expenseService.createExpense(data);
      setShowCreateForm(false);
      fetchExpenses(true);
    } catch (error: any) {
      console.error('Failed to create expense:', error);
      alert(error.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Post Expense ────────────────────────────────────────────

  const handlePostExpense = async (id: string) => {
    setSubmitting(true);
    try {
      await expenseService.postExpense(id);
      setViewingExpense(null);
      fetchExpenses(true);
    } catch (error: any) {
      console.error('Failed to post expense:', error);
      alert(error.message || 'Failed to post expense');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Expense ──────────────────────────────────────────

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense entry?')) return;
    setSubmitting(true);
    try {
      await expenseService.deleteExpense(id);
      setViewingExpense(null);
      fetchExpenses(true);
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      alert(error.message || 'Failed to delete expense');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Expense Detail ─────────────────────────────────────

  const viewExpenseDetail = (expense: Expense) => {
    setViewingExpense(expense);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Posted': return 'bg-green-100 text-green-700';
      case 'Draft': return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Posted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Draft': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Cancelled': return <Ban className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Rent': return 'text-red-600 bg-red-50';
      case 'Utilities': return 'text-blue-600 bg-blue-50';
      case 'Salaries': return 'text-green-600 bg-green-50';
      case 'Marketing': return 'text-yellow-600 bg-yellow-50';
      case 'Office Supplies': return 'text-purple-600 bg-purple-50';
      case 'Travel': return 'text-orange-600 bg-orange-50';
      case 'Meals': return 'text-teal-600 bg-teal-50';
      case 'Insurance': return 'text-cyan-600 bg-cyan-50';
      case 'Maintenance': return 'text-lime-600 bg-lime-50';
      case 'Software': return 'text-indigo-600 bg-indigo-50';
      case 'Taxes': return 'text-pink-600 bg-pink-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Rent': return HomeIcon;
      case 'Utilities': return Bolt;
      case 'Salaries': return UsersIcon;
      case 'Marketing': return Megaphone;
      case 'Office Supplies': return Package;
      case 'Travel': return Plane;
      case 'Meals': return Utensils;
      case 'Insurance': return Security;
      case 'Maintenance': return Build;
      case 'Software': return Computer;
      case 'Taxes': return ReceiptIcon2;
      default: return ReceiptIcon;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateExpenseForm
          expenseAccounts={expenseAccounts}
          vendors={vendors}
          bankAccounts={bankAccounts}
          paymentMethods={paymentMethods}
          expenseTypeOptions={expenseTypeOptions.filter(t => t !== 'All')}
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateExpense}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Expenses
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} entries)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Expense</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalExpense)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">This Month</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(stats.thisMonth)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">This Week</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(stats.thisWeek)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Tax</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalTax)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Records</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.totalCount}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={filter.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={filter.expenseType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {expenseTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => handleDateRangeChange(e.target.value, filter.endDate)}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                    placeholder="From"
                  />
                  <span className="text-gray-400 text-xs md:text-sm hidden xs:inline">to</span>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => handleDateRangeChange(filter.startDate, e.target.value)}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                    placeholder="To"
                  />
                  {(filter.startDate || filter.endDate) && (
                    <button onClick={clearDateRange} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expense List */}
          <div className="space-y-3 md:space-y-4">
            {loading && expenses.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading expense entries...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <TrendingDown className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No expense records found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              expenses.map((expense) => {
                const statusColor = getStatusColor(expense.status);
                const statusIcon = getStatusIcon(expense.status);
                const typeColor = getTypeColor(expense.expenseType);
                const Icon = getTypeIcon(expense.expenseType);

                return (
                  <div
                    key={expense.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewExpenseDetail(expense)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{expense.expenseNumber}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{expense.status}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs font-medium text-gray-500">{expense.expenseType}</span>
                            {expense.vendorName && (
                              <>
                                <span className="text-[10px] md:text-xs text-gray-300">•</span>
                                <span className="text-[10px] md:text-xs text-gray-500">{expense.vendorName}</span>
                              </>
                            )}
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{expense.paymentMethod}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{formatDate(expense.date)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(expense.totalAmount)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">{expense.items.length} items</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && expenses.length > 0 && (
            <div className="flex justify-center py-3 md:py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col xs:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-sm text-gray-500 text-center xs:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <span className="px-2 md:px-4 py-1 md:py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg text-xs md:text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Expense Detail Modal */}
      {viewingExpense && (
        <ExpenseDetailModal
          expense={viewingExpense}
          onClose={() => setViewingExpense(null)}
          onPost={handlePostExpense}
          onDelete={handleDeleteExpense}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getTypeColor={getTypeColor}
          getTypeIcon={getTypeIcon}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE EXPENSE FORM
// ═══════════════════════════════════════════════════════════════

function CreateExpenseForm({
  expenseAccounts,
  vendors,
  bankAccounts,
  paymentMethods,
  expenseTypeOptions,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expenseType: 'Rent',
    expenseAccountId: '',
    vendorId: '',
    description: '',
    reference: '',
    paymentMethod: 'Cash',
    bankAccountId: '',
    taxRate: 0
  });

  const [items, setItems] = useState<ExpenseItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);

  const [simpleAmount, setSimpleAmount] = useState(0);
  const [error, setError] = useState('');

  const requiresItems = formData.expenseType === 'Rent' || formData.expenseType === 'Office Supplies' || formData.expenseType === 'Software';

  const calculateTotal = () => {
    if (requiresItems) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      return subtotal + (subtotal * (formData.taxRate / 100));
    }
    return simpleAmount;
  };

  const total = calculateTotal();

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = item.quantity * item.unitPrice;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expenseAccountId) {
      setError('Please select an expense account');
      return;
    }
    if (requiresItems) {
      const hasInvalidItem = items.some(item => !item.description.trim() || item.unitPrice <= 0);
      if (hasInvalidItem) {
        setError('Please fill all item details');
        return;
      }
    } else if (simpleAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError(`Please select a bank account for ${formData.paymentMethod}`);
      return;
    }
    setError('');

    onSave({
      date: formData.date,
      expenseType: formData.expenseType,
      expenseAccountId: formData.expenseAccountId,
      vendorId: formData.vendorId || undefined,
      items: requiresItems ? items : [],
      amount: requiresItems ? undefined : simpleAmount,
      taxRate: requiresItems ? formData.taxRate : 0,
      description: formData.description,
      reference: formData.reference,
      paymentMethod: formData.paymentMethod,
      bankAccountId: formData.paymentMethod !== 'Cash' ? formData.bankAccountId : undefined
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Expense</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[600px] md:max-h-[700px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          {/* Expense Type */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Expense Type *</label>
            <select
              value={formData.expenseType}
              onChange={(e) => setFormData(prev => ({ ...prev, expenseType: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {expenseTypeOptions.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Expense Account */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Expense Account *</label>
            <select
              value={formData.expenseAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, expenseAccountId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select expense account...</option>
              {expenseAccounts.map((acc: any) => (
                <option key={acc.id || acc._id} value={acc.id || acc._id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Vendor</label>
            <select
              value={formData.vendorId}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select vendor...</option>
              {vendors.map((vendor: any) => (
                <option key={vendor.id || vendor._id} value={vendor.id || vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items or Simple Amount */}
          {requiresItems ? (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Items</label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Description *"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                        />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Unit Price *"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                          />
                        </div>
                      </div>
                      {item.amount > 0 && (
                        <p className="text-xs font-semibold text-[#014582] text-right">Amount: {formatCurrency(item.amount)}</p>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-[#014582] font-semibold hover:text-[#01366a]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={simpleAmount}
                  onChange={(e) => setSimpleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
            </div>
          )}

          {/* Tax Rate (for items) */}
          {requiresItems && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Tax Rate</label>
              <TaxRateSelect
                value={formData.taxRate}
                onChange={(rate) => setFormData(prev => ({ ...prev, taxRate: rate }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          )}

          {/* Total Amount */}
          <div className="p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span className="text-[#014582]">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="e.g., EXP-001"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {paymentMethods.map((method: string) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Bank Account */}
          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select bank account...</option>
                {bankAccounts.map((acc: any) => (
                  <option key={acc.id || acc._id} value={acc.id || acc._id}>
                    {acc.accountName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPENSE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function ExpenseDetailModal({
  expense,
  onClose,
  onPost,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getTypeColor,
  getTypeIcon,
  submitting
}: any) {
  const Icon = getTypeIcon(expense.expenseType);
  const typeColor = getTypeColor(expense.expenseType);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{expense.expenseNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${getStatusColor(expense.status)}`}>
                  {getStatusIcon(expense.status)}
                  {expense.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{expense.expenseType}</span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(expense.date)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Total Amount</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(expense.totalAmount)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Subtotal</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(expense.subtotal)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {expense.vendorName && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Vendor</span>
                <span className="text-sm font-medium text-gray-800">{expense.vendorName}</span>
              </div>
            )}
            {expense.expenseAccount && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Expense Account</span>
                <span className="text-sm font-medium text-gray-800">
                  {expense.expenseAccount.code} - {expense.expenseAccount.name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Payment Method</span>
              <span className="text-sm font-medium text-gray-800">{expense.paymentMethod}</span>
            </div>
            {expense.reference && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Reference</span>
                <span className="text-sm font-medium text-gray-800">{expense.reference}</span>
              </div>
            )}
            {expense.description && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Description</span>
                <span className="text-sm font-medium text-gray-800">{expense.description}</span>
              </div>
            )}
          </div>

          {/* Items */}
          {expense.items.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">Items</h4>
                <span className="text-xs text-gray-400">{expense.items.length} items</span>
              </div>
              <div className="space-y-2">
                {expense.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {expense.status === 'Draft' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onPost(expense.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                Post Expense
              </button>
              <button
                onClick={() => onDelete(expense.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}