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
  Download as DownloadIcon, Printer as PrinterIcon
} from 'lucide-react';
import { generalLedgerService, AccountSummary, LedgerEntry, LedgerStats } from '../../api/general-ledger/route';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  account: string;
  status: string;
  startDate: string;
  endDate: string;
  showDebitOnly: boolean;
  showCreditOnly: boolean;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
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
  const [stats, setStats] = useState<LedgerStats>({
    totalDebit: 0,
    totalCredit: 0,
    difference: 0,
    entryCount: 0,
    isBalanced: true
  });
  const [filter, setFilter] = useState<FilterState>({
    account: 'All Accounts',
    status: 'All',
    startDate: '',
    endDate: '',
    showDebitOnly: false,
    showCreditOnly: false
  });
  const [viewingEntry, setViewingEntry] = useState<LedgerEntry | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Fetch Account Summaries ─────────────────────────────────

  const fetchAccountSummaries = useCallback(async () => {
    try {
      const response = await generalLedgerService.getAccountSummaries({
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined
      });
      setAccountSummaries(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch account summaries:', error);
      setAccountSummaries([]);
    }
  }, [filter.startDate, filter.endDate]);

  // ─── Fetch Ledger Entries ────────────────────────────────────

  const fetchEntries = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const accountId = filter.account !== 'All Accounts' 
        ? accountSummaries.find(a => a.accountName === filter.account)?.accountId 
        : undefined;

      const response = await generalLedgerService.getEntries({
        page,
        limit: pagination.limit,
        accountId: accountId,
        search: searchTerm || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        showDebitOnly: filter.showDebitOnly || undefined,
        showCreditOnly: filter.showCreditOnly || undefined
      });

      console.log('Fetch entries response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      console.log('Response data:', response.data);

      const entriesData = response.data;
      const safeEntries = Array.isArray(entriesData) ? entriesData : [];
      
      console.log('Setting entries to:', safeEntries);
      setEntries(safeEntries);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch entries:', error);
      setEntries([]);
      alert(error.message || 'Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit, accountSummaries]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const accountId = filter.account !== 'All Accounts' 
        ? accountSummaries.find(a => a.accountName === filter.account)?.accountId 
        : undefined;

      const response = await generalLedgerService.getEntries({
        page: nextPage,
        limit: pagination.limit,
        accountId: accountId,
        search: searchTerm || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        showDebitOnly: filter.showDebitOnly || undefined,
        showCreditOnly: filter.showCreditOnly || undefined
      });

      const newEntries = Array.isArray(response.data) ? response.data : [];
      setEntries(prev => [...prev, ...newEntries]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more entries:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm, accountSummaries]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchAccountSummaries();
  }, []);

  useEffect(() => {
    fetchEntries(true);
  }, [filter, searchTerm]);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleAccountChange = (account: string) => {
    setFilter(prev => ({ ...prev, account }));
  };

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setFilter(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  const clearDateRange = () => {
    setFilter(prev => ({ ...prev, startDate: '', endDate: '' }));
  };

  const toggleDebitFilter = () => {
    setFilter(prev => ({
      ...prev,
      showDebitOnly: !prev.showDebitOnly,
      showCreditOnly: false
    }));
  };

  const toggleCreditFilter = () => {
    setFilter(prev => ({
      ...prev,
      showCreditOnly: !prev.showCreditOnly,
      showDebitOnly: false
    }));
  };

  const clearFilters = () => {
    setFilter({
      account: 'All Accounts',
      status: 'All',
      startDate: '',
      endDate: '',
      showDebitOnly: false,
      showCreditOnly: false
    });
  };

  const handleRefresh = () => {
    fetchEntries(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchEntries(false);
  };

  // ─── View Entry Detail ─────────────────────────────────────

  const viewEntryDetail = (entry: LedgerEntry) => {
    setViewingEntry(entry);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getAccountTypeColor = (accountName: string) => {
    const name = accountName.toLowerCase();
    if (name.includes('cash') || name.includes('bank') || name.includes('receivable') || name.includes('asset')) {
      return 'text-green-600 bg-green-50';
    }
    if (name.includes('payable') || name.includes('loan') || name.includes('liability')) {
      return 'text-red-600 bg-red-50';
    }
    if (name.includes('revenue') || name.includes('sales') || name.includes('income')) {
      return 'text-blue-600 bg-blue-50';
    }
    if (name.includes('expense') || name.includes('rent') || name.includes('salary') || name.includes('cost')) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  const getAccountIcon = (accountName: string) => {
    const name = accountName.toLowerCase();
    if (name.includes('cash') || name.includes('bank') || name.includes('receivable') || name.includes('asset')) {
      return Landmark;
    }
    if (name.includes('payable') || name.includes('loan') || name.includes('liability')) {
      return Wallet;
    }
    if (name.includes('revenue') || name.includes('sales') || name.includes('income')) {
      return TrendingUp;
    }
    if (name.includes('expense') || name.includes('rent') || name.includes('salary') || name.includes('cost')) {
      return TrendingDown;
    }
    return Landmark;
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (entry: LedgerEntry) => {
    if (entry.debit > 0) return 'text-green-600';
    if (entry.credit > 0) return 'text-red-600';
    return 'text-gray-400';
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
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
            General Ledger
            <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
              ({pagination.total} entries)
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#7c4dff] transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <FilterIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Clear Filters</span>
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
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Entries</p>
          <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.entryCount}</p>
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
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="relative flex-1 sm:flex-none min-w-[120px]">
              <select
                value={filter.account}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="All Accounts">All Accounts</option>
                {accountSummaries.map((acc) => (
                  <option key={acc.accountId} value={acc.accountName}>
                    {acc.accountCode} - {acc.accountName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, filter.endDate)}
                className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                placeholder="From"
              />
              <span className="text-gray-400 text-xs md:text-sm hidden xs:inline">to</span>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => handleDateRangeChange(filter.startDate, e.target.value)}
                className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
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

        {/* Debit/Credit Toggle */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={toggleDebitFilter}
            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              filter.showDebitOnly
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Debit Only
            </span>
          </button>
          <button
            onClick={toggleCreditFilter}
            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              filter.showCreditOnly
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Credit Only
            </span>
          </button>
          {(filter.showDebitOnly || filter.showCreditOnly) && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Journal ID</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Reference</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Debit</th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit</th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Balance</th>
                <th className="text-center px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (Array.isArray(entries) ? entries : []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 md:py-12">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                    <p className="mt-2 text-xs md:text-sm text-gray-500">Loading ledger entries...</p>
                  </td>
                </tr>
              ) : (Array.isArray(entries) ? entries : []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 md:py-12 text-gray-400">
                    <BookOpen className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                    <p className="text-sm md:text-lg font-medium text-gray-500">No ledger entries found</p>
                    <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                (Array.isArray(entries) ? entries : []).map((entry) => {
                  const Icon = getAccountIcon(entry.accountName);
                  const colorClass = getAccountTypeColor(entry.accountName);
                  const isDebit = entry.debit > 0;
                  const balancePositive = entry.balance >= 0;

                  return (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-2 md:py-3">
                        <p className="text-xs md:text-sm text-gray-600">{formatDate(entry.date)}</p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">
                        <span className="text-[10px] md:text-xs font-mono font-semibold text-[#7c4dff] bg-[#7c4dff]/10 px-1.5 md:px-2 py-0.5 rounded">
                          {entry.journalId ? `JE-${entry.journalId.substring(0, 6)}` : '-'}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className={`p-1 rounded ${colorClass}`}>
                            <Icon className="w-3 h-3 md:w-4 md:h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-medium text-gray-800 truncate max-w-[120px] md:max-w-[180px]">
                              {entry.accountName}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-400">{entry.accountCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">
                        <p className="text-xs md:text-sm text-gray-500">{entry.reference || '-'}</p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                        <p className="text-xs md:text-sm text-gray-600 truncate max-w-[200px]">{entry.description}</p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 text-right">
                        <p className={`text-xs md:text-sm font-semibold ${isDebit ? 'text-green-600' : 'text-gray-400'}`}>
                          {isDebit ? formatCurrency(entry.debit) : '-'}
                        </p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 text-right">
                        <p className={`text-xs md:text-sm font-semibold ${!isDebit && entry.credit > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {!isDebit && entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 text-right hidden sm:table-cell">
                        <p className={`text-xs md:text-sm font-bold ${balancePositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(entry.balance)}
                        </p>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-3 text-center">
                        <button
                          onClick={() => viewEntryDetail(entry)}
                          className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Detail"
                        >
                          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {pagination.hasNext && entries.length > 0 && (
          <div className="flex justify-center py-3 md:py-4 border-t border-gray-100">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[#7c4dff] hover:bg-[#7c4dff]/10 rounded-lg transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>

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
            <span className="px-2 md:px-4 py-1 md:py-2 bg-[#7c4dff]/10 text-[#7c4dff] font-semibold rounded-lg text-xs md:text-sm">
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

      {/* Entry Detail Modal */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getAccountTypeColor={getAccountTypeColor}
          getAccountIcon={getAccountIcon}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ENTRY DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function EntryDetailModal({
  entry,
  onClose,
  formatCurrency,
  formatDate,
  getAccountTypeColor,
  getAccountIcon
}: any) {
  const Icon = getAccountIcon(entry.accountName);
  const colorClass = getAccountTypeColor(entry.accountName);
  const isDebit = entry.debit > 0;
  const balancePositive = entry.balance >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#7c4dff]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${colorClass}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{entry.accountName}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className="text-[10px] md:text-xs text-gray-400">{entry.accountCode}</span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(entry.date)}</span>
                {entry.reference && (
                  <>
                    <span className="text-[10px] md:text-xs text-gray-400">•</span>
                    <span className="text-[10px] md:text-xs text-gray-500">Ref: {entry.reference}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Description */}
          <div className="mb-4">
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">Description</p>
            <p className="text-sm md:text-base text-gray-800 mt-1">{entry.description}</p>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Debit</p>
              <p className={`text-lg md:text-xl font-bold ${isDebit ? 'text-green-600' : 'text-gray-400'}`}>
                {isDebit ? formatCurrency(entry.debit) : '-'}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Credit</p>
              <p className={`text-lg md:text-xl font-bold ${!isDebit && entry.credit > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {!isDebit && entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gray-50 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-gray-500">Balance</p>
            <p className={`text-lg md:text-xl font-bold ${balancePositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(entry.balance)}
            </p>
          </div>

          {/* Meta Info */}
          {entry.journalId && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Journal Entry</p>
              <p className="text-sm md:text-base text-gray-800 mt-1">JE-{entry.journalId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}