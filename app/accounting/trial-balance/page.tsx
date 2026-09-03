'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Book, Users,
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
  Eye as EyeIcon, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { trialBalanceService, TrialBalanceAccount, TrialBalanceStats } from '../../api/trail-balance/route';
import { useFiscalYear } from '../../../lib/fiscal-year-context';
import { useLocation } from '../../../lib/location-context';
import { useCurrency } from '../../../lib/currency-context';
import FiscalYearSelect from '../../../components/FiscalYearSelect';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  accountType: string;
  showZeroBalance: boolean;
  startDate: string;
  endDate: string;
  fiscalYearId: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export function TrialBalancePage() {
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
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
  const [stats, setStats] = useState<TrialBalanceStats>({
    totalDebit: 0,
    totalCredit: 0,
    difference: 0,
    isBalanced: true,
    totalAccounts: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    accountType: 'All',
    showZeroBalance: true,
    startDate: '',
    endDate: '',
    fiscalYearId: ''
  });
  const [viewingAccount, setViewingAccount] = useState<TrialBalanceAccount | null>(null);
  const [showZeroBalance, setShowZeroBalance] = useState(true);
  const { selectedFiscalYearId, selectedFiscalYear } = useFiscalYear();
  const { locationIdForApi } = useLocation();

  const { symbol: currencySymbol } = useCurrency();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const accountTypes = ['All', 'Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];

  // ─── Get Currency Symbol from Local Storage ──────────────────

  // ─── Fetch Trial Balance ─────────────────────────────────────

  const fetchTrialBalance = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await trialBalanceService.getTrialBalance({
        page,
        limit: pagination.limit,
        accountType: filter.accountType !== 'All' ? filter.accountType : undefined,
        showZeroBalance: filter.showZeroBalance,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        fiscalYearId: selectedFiscalYearId || filter.fiscalYearId || undefined,
        locationId: locationIdForApi || undefined,
        search: searchTerm || undefined
      });

      setAccounts(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch trial balance:', error);
      alert(error.message || 'Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit, selectedFiscalYearId, locationIdForApi]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await trialBalanceService.getTrialBalance({
        page: nextPage,
        limit: pagination.limit,
        accountType: filter.accountType !== 'All' ? filter.accountType : undefined,
        showZeroBalance: filter.showZeroBalance,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        fiscalYearId: selectedFiscalYearId || filter.fiscalYearId || undefined,
        locationId: locationIdForApi || undefined,
        search: searchTerm || undefined
      });

      setAccounts(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more accounts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm, selectedFiscalYearId, locationIdForApi]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchTrialBalance(true);
  }, [selectedFiscalYearId, locationIdForApi]);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchTrialBalance(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchTrialBalance(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleAccountTypeChange = (type: string) => {
    setFilter(prev => ({ ...prev, accountType: type }));
    fetchTrialBalance(true);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setFilter(prev => ({ ...prev, startDate: start, endDate: end }));
    fetchTrialBalance(true);
  };

  const clearDateRange = () => {
    setFilter(prev => ({ ...prev, startDate: '', endDate: '' }));
    fetchTrialBalance(true);
  };

  const toggleZeroBalance = () => {
    setShowZeroBalance(prev => !prev);
    setFilter(prev => ({ ...prev, showZeroBalance: !prev.showZeroBalance }));
    fetchTrialBalance(true);
  };

  const handleRefresh = () => {
    fetchTrialBalance(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchTrialBalance(false);
  };

  // ─── View Account Detail ─────────────────────────────────────

  const viewAccountDetail = (account: TrialBalanceAccount) => {
    setViewingAccount(account);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Assets': return 'text-green-600 bg-green-50';
      case 'Liabilities': return 'text-red-600 bg-red-50';
      case 'Equity': return 'text-purple-600 bg-purple-50';
      case 'Income': return 'text-blue-600 bg-blue-50';
      case 'Expenses': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Assets': return Landmark;
      case 'Liabilities': return CreditCardIcon;
      case 'Equity': return Wallet;
      case 'Income': return TrendingUp;
      case 'Expenses': return TrendingDown;
      default: return Landmark;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            Trial Balance
            <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
              ({pagination.total} accounts)
              {selectedFiscalYear ? ` · ${selectedFiscalYear.name}` : ''}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <FiscalYearSelect compact showManageLink={false} />
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleZeroBalance}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              showZeroBalance
                ? 'bg-[#014582] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showZeroBalance ? <EyeIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            {showZeroBalance ? 'Show Zero' : 'Hide Zero'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Debit</p>
          <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalDebit)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Credit</p>
          <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalCredit)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Difference</p>
          <p className={`text-lg md:text-xl font-bold ${stats.isBalanced ? 'text-green-600' : 'text-orange-600'} mt-0.5 md:mt-1`}>
            {formatCurrency(stats.difference)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Status</p>
          <p className={`text-lg md:text-xl font-bold ${stats.isBalanced ? 'text-green-600' : 'text-orange-600'} mt-0.5 md:mt-1`}>
            {stats.isBalanced ? '✓ Balanced' : '⚠ Not Balanced'}
          </p>
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
                value={filter.accountType}
                onChange={(e) => handleAccountTypeChange(e.target.value)}
                className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {accountTypes.map((type) => (
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

      {/* Accounts List */}
      <div className="space-y-3 md:space-y-4">
        {loading && accounts.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
            <p className="mt-2 text-xs md:text-sm text-gray-500">Loading trial balance...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-400">
            <Scale className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
            <p className="text-sm md:text-lg font-medium text-gray-500">No accounts found</p>
            <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          accounts.map((account) => {
            const Icon = getAccountIcon(account.accountType);
            const colorClass = getAccountTypeColor(account.accountType);
            const netBalance = account.debitBalance - account.creditBalance;
            const isZero = account.debitBalance === 0 && account.creditBalance === 0;

            if (!showZeroBalance && isZero) return null;

            return (
              <div
                key={account.accountId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                onClick={() => viewAccountDetail(account)}
              >
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-2.5 rounded-xl ${colorClass}`}>
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{account.accountName}</p>
                        {isZero && (
                          <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Zero
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                        <span className="text-[10px] md:text-xs font-mono font-semibold text-[#014582] bg-[#014582]/10 px-1.5 md:px-2 py-0.5 rounded">
                          {account.accountCode}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-400">•</span>
                        <span className="text-[10px] md:text-xs text-gray-500">{account.accountType}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs md:text-sm font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(netBalance))}
                      </p>
                      <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full ${netBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {netBalance >= 0 ? 'Dr' : 'Cr'}
                      </span>
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

      {/* Account Detail Modal */}
      {viewingAccount && (
        <AccountDetailModal
          account={viewingAccount}
          onClose={() => setViewingAccount(null)}
          formatCurrency={formatCurrency}
          getAccountTypeColor={getAccountTypeColor}
          getAccountIcon={getAccountIcon}
        />
      )}
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
  getAccountTypeColor,
  getAccountIcon
}: any) {
  const Icon = getAccountIcon(account.accountType);
  const colorClass = getAccountTypeColor(account.accountType);
  const netBalance = account.debitBalance - account.creditBalance;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${colorClass}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{account.accountName}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className="text-[10px] md:text-xs font-mono font-semibold text-[#014582] bg-[#014582]/10 px-1.5 md:px-2 py-0.5 rounded">
                  {account.accountCode}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{account.accountType}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Debit</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(account.debitBalance)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Credit</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(account.creditBalance)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-500">Net Balance</p>
            <p className={`text-lg md:text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netBalance))}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {netBalance >= 0 ? '(Dr)' : '(Cr)'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
