'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Banknote, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText,
  RefreshCw, Trash2, Building2, CalendarDays,
  Receipt, Wallet, ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown, CreditCard as CreditCardIcon,
  Send, Save, Printer, Download, Landmark,
  ReceiptText, ReceiptIndianRupee, ShoppingCart,
  User, Phone, Mail, Building, TrendingUp, TrendingDown,
  
  Edit, Archive, MoreVertical, Info, Layers,
  BookOpen, FileSpreadsheet, FileText as FileTextIcon,
  PlusCircle, MinusCircle, List, Scale,
  Filter as FilterIcon, Calendar as CalendarIcon,
  Download as DownloadIcon, Printer as PrinterIcon,
  Eye as EyeIcon, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon,
  History, Building as BuildingIcon, Hash,
  Banknote as BanknoteIcon, CreditCard
} from 'lucide-react';
import { bankAccountService, BankAccount, BankAccountStats } from '../../api/bankAccounts/route';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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
  const [stats, setStats] = useState<BankAccountStats>({
    totalBalance: 0,
    pkrBalance: 0,
    usdBalance: 0,
    activeCount: 0,
    totalCount: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All'
  });
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Active', 'Inactive'];
  const accountColors = [
    '#1AB4F5', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#3498DB', '#E67E22'
  ];

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

  const getCurrencyCode = () => {
    try {
      const saved = localStorage.getItem('sales_selected_currency');
      if (saved) {
        const currency = JSON.parse(saved);
        return currency.code || 'PKR';
      }
    } catch (e) {
      console.error('Error getting currency:', e);
    }
    return 'PKR';
  };

  const [currencyCode, setCurrencyCode] = useState('PKR');

  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol());
    setCurrencyCode(getCurrencyCode());
  }, []);

  // ─── Get Color for Account ───────────────────────────────────

  const getColorForAccount = (accountName: string) => {
    let hash = 0;
    for (let i = 0; i < accountName.length; i++) {
      hash = accountName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return accountColors[Math.abs(hash) % accountColors.length];
  };

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchAccounts = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await bankAccountService.getAccounts({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setAccounts(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch bank accounts:', error);
      alert(error.message || 'Failed to load bank accounts');
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
      const response = await bankAccountService.getAccounts({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setAccounts(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more accounts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchAccounts(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchAccounts(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchAccounts(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchAccounts(true);
  };

  const handleRefresh = () => {
    fetchAccounts(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchAccounts(false);
  };

  // ─── Create Account ─────────────────────────────────────────

  const handleCreateAccount = async (data: any) => {
    setSubmitting(true);
    try {
      await bankAccountService.createAccount(data);
      setShowCreateForm(false);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to create account:', error);
      alert(error.message || 'Failed to create bank account');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Account Detail ─────────────────────────────────────

  const viewAccountDetail = (account: BankAccount) => {
    setViewingAccount(account);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompactCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1e6) {
      return `${currencySymbol} ${(amount / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1e3) {
      return `${currencySymbol} ${(amount / 1e3).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const getStatusDot = (status: string) => {
    return status === 'Active' ? 'bg-green-500' : 'bg-red-500';
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateAccountForm
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateAccount}
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
                <Banknote className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Cash & Bank Ledgers
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} accounts)
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
                <span className="hidden sm:inline">Add Account</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Balance</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalBalance)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">{currencyCode} Balance</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(stats.pkrBalance)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">USD Balance</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(stats.usdBalance)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Active Accounts</p>
              <p className="text-lg md:text-xl font-bold text-[#014582] mt-0.5 md:mt-1">{stats.activeCount}</p>
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
                  placeholder="Search accounts..."
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
              </div>
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-3 md:space-y-4">
            {loading && accounts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading bank accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Banknote className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No bank accounts found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              accounts.map((account) => {
                const color = getColorForAccount(account.accountName);
                const isActive = account.status === 'Active';
                const balancePositive = account.currentBalance >= 0;

                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewAccountDetail(account)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-2.5 rounded-xl`} style={{ backgroundColor: `${color}20` }}>
                          <Banknote className="w-4 h-4 md:w-5 md:h-5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{account.accountName}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full ${getStatusColor(account.status)}`}>
                              {account.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{account.bankName}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{account.accountNumber}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{account.accountType}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs font-semibold text-[#014582]">{account.currency}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm md:text-base font-bold ${balancePositive ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(account.currentBalance)}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-400">Balance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && accounts.length > 0 && (
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

      {/* Account Detail Modal */}
      {viewingAccount && (
        <AccountDetailModal
          account={viewingAccount}
          onClose={() => setViewingAccount(null)}
          formatCurrency={formatCurrency}
          formatCompactCurrency={formatCompactCurrency}
          getColorForAccount={getColorForAccount}
          getStatusDot={getStatusDot}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE ACCOUNT FORM
// ═══════════════════════════════════════════════════════════════

function CreateAccountForm({
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountType: 'Current',
    currency: 'PKR',
    openingBalance: 0
  });

  const [error, setError] = useState('');
  const accountTypes = ['Current', 'Savings', 'Business', 'Islamic'];
  const currencies = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return;
    }
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    setError('');
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Banknote className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Bank Account</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Name *</label>
              <input
                type="text"
                placeholder="e.g., HBL Current Account"
                value={formData.accountName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Number *</label>
              <input
                type="text"
                placeholder="e.g., 1234-5678-9012"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Name *</label>
              <input
                type="text"
                placeholder="e.g., Habib Bank Limited"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Branch Code</label>
              <input
                type="text"
                placeholder="e.g., 0123"
                value={formData.branchCode}
                onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Opening Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.openingBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

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
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function AccountDetailModal({
  account,
  onClose,
  formatCurrency,
  formatCompactCurrency,
  getColorForAccount,
  getStatusDot
}: any) {
  const color = getColorForAccount(account.accountName);
  const balancePositive = account.currentBalance >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
              <Banknote className="w-5 h-5 md:w-6 md:h-6" style={{ color }} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{account.accountName}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className="text-[10px] md:text-xs text-gray-500">{account.accountNumber}</span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{account.bankName}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Opening Balance</p>
              <p className="text-sm md:text-base font-bold text-gray-800">{formatCurrency(account.openingBalance)}</p>
            </div>
            <div className={`rounded-xl p-3 md:p-4 ${balancePositive ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-[10px] md:text-xs text-gray-500">Current Balance</p>
              <p className={`text-sm md:text-base font-bold ${balancePositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(account.currentBalance)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Bank Name</span>
              <span className="text-sm font-medium text-gray-800">{account.bankName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Account Number</span>
              <span className="text-sm font-medium text-gray-800">{account.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Branch Code</span>
              <span className="text-sm font-medium text-gray-800">{account.branchCode || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Account Type</span>
              <span className="text-sm font-medium text-gray-800">{account.accountType}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Currency</span>
              <span className="text-sm font-medium text-gray-800">{account.currency}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400 font-medium">Status</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <span className={`w-2 h-2 rounded-full ${getStatusDot(account.status)}`} />
                {account.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}