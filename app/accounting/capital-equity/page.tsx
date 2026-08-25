'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrency } from '../../../lib/currency-context';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Users, Receipt,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText, CreditCard,
  RefreshCw, Trash2, Building2, CalendarDays,
  ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown,
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
  Banknote as BanknoteIcon, Handshake, Home, ShoppingBag,
  Receipt as ReceiptIcon, Briefcase, DollarSign as DollarSignIcon,
  Home as HomeIcon, Bolt, Users as UsersIcon, Megaphone, Package, Plane, Utensils,
  Shield as Security, Wrench as Build, Monitor, Receipt as ReceiptIcon2,
  UserCircle, PhoneCall, Mail as MailIcon, FileText as FileTextIcon2,
  CheckCircle as CheckCircleIcon, AlertTriangle as AlertTriangleIcon,
  Settings, CreditCard as CreditCardIcon,
  TrendingUp, PiggyBank,
  PlusCircle as PlusCircleIcon, MinusCircle as MinusCircleIcon
} from 'lucide-react';
import {
  equityService,
  EquityAccount,
  EquitySummary,
  OwnerTransaction,
  buildEquitySummary,
} from '../../api/capital-equity/route';
import { toast } from 'react-hot-toast';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  type: string;
  search: string;
}

interface TransactionFormData {
  amount: number;
  description: string;
  reference?: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function CapitalEquityPage() {
  const [equityAccounts, setEquityAccounts] = useState<EquityAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [summary, setSummary] = useState<EquitySummary>({
    totalCapital: 0,
    totalRetainedEarnings: 0,
    totalReserves: 0,
    totalDrawings: 0,
    totalEquity: 0
  });
  const [transactions, setTransactions] = useState<OwnerTransaction[]>([]);
  const [filter, setFilter] = useState<FilterState>({
    type: 'All',
    search: ''
  });
  const [selectedAccount, setSelectedAccount] = useState<EquityAccount | null>(null);
  const [showAddCapitalForm, setShowAddCapitalForm] = useState(false);
  const [showDrawingsForm, setShowDrawingsForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const { symbol: currencySymbol } = useCurrency();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const typeOptions = ['All', 'Capital', 'Retained Earnings', 'Drawings', 'Reserves'];

  // ─── Get Currency Symbol from Local Storage ──────────────────

  // ─── Fetch Equity Accounts (same source as Flutter: COA type=Equity) ──

  const fetchEquityAccounts = useCallback(async (
    resetPage = true,
    overrides?: { search?: string; type?: string; page?: number }
  ) => {
    const page = overrides?.page ?? (resetPage ? 1 : pagination.page);
    const search = overrides?.search ?? searchTerm;
    const type = overrides?.type ?? filter.type;

    if (resetPage) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await equityService.getEquityAccounts({
        page,
        limit: pagination.limit || 20,
        search: search || undefined,
        accountType: type !== 'All' ? type : undefined,
      });

      setEquityAccounts(response.data || []);
      setPagination(response.pagination);
      // Match Flutter: derive summary from loaded equity COA balances
      setSummary(response.summary || buildEquitySummary(response.data || []));
    } catch (error: any) {
      console.error('Failed to fetch equity accounts:', error);
      toast.error(error.message || 'Failed to load equity accounts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter.type, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Transactions ─────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await equityService.getTransactions();
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await equityService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await equityService.getEquityAccounts({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        accountType: filter.type !== 'All' ? filter.type : undefined,
      });

      setEquityAccounts((prev) => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more equity accounts:', error);
      toast.error('Failed to load more equity accounts');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter.type, searchTerm, loadingMore]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchEquityAccounts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setFilter((prev) => ({ ...prev, search: query }));
    fetchEquityAccounts(true, { search: query, type: filter.type, page: 1 });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilter((prev) => ({ ...prev, search: '' }));
    fetchEquityAccounts(true, { search: '', type: filter.type, page: 1 });
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleTypeChange = (type: string) => {
    setFilter((prev) => ({ ...prev, type }));
    fetchEquityAccounts(true, { search: searchTerm, type, page: 1 });
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchTransactions();
    fetchEquityAccounts(true);
  };

  const handlePageChange = (page: number) => {
    fetchEquityAccounts(false, { page, search: searchTerm, type: filter.type });
  };

  // ─── Add Capital ─────────────────────────────────────────────

  const handleAddCapital = async (data: any) => {
    setSubmitting(true);
    try {
      // accountId is already the Chart of Accounts id (same as Flutter)
      await equityService.addCapital(data);
      toast.success('Capital added successfully!');
      setShowAddCapitalForm(false);
      setSelectedAccount(null);
      fetchSummary();
      fetchTransactions();
      fetchEquityAccounts(true);
    } catch (error: any) {
      console.error('Failed to add capital:', error);
      toast.error(error.message || 'Failed to add capital');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Record Drawings ─────────────────────────────────────────

  const handleRecordDrawings = async (data: any) => {
    setSubmitting(true);
    try {
      await equityService.recordDrawings(data);
      toast.success('Drawings recorded successfully!');
      setShowDrawingsForm(false);
      setSelectedAccount(null);
      fetchSummary();
      fetchTransactions();
      fetchEquityAccounts(true);
    } catch (error: any) {
      console.error('Failed to record drawings:', error);
      toast.error(error.message || 'Failed to record drawings');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Transfer to Retained Earnings ──────────────────────────

  const handleTransferToRetainedEarnings = async (data: any) => {
    setSubmitting(true);
    try {
      await equityService.transferToRetainedEarnings(data);
      toast.success('Transfer completed successfully!');
      setShowTransactionForm(false);
      fetchSummary();
      fetchTransactions();
      fetchEquityAccounts(true);
    } catch (error: any) {
      console.error('Failed to transfer:', error);
      toast.error(error.message || 'Failed to transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Account Detail ─────────────────────────────────────

  const viewAccountDetail = (account: EquityAccount) => {
    setSelectedAccount(account);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Capital': return 'text-purple-600 bg-purple-100';
      case 'Retained Earnings': return 'text-green-600 bg-green-100';
      case 'Reserves': return 'text-yellow-600 bg-yellow-100';
      case 'Drawings': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Capital': return Landmark;
      case 'Retained Earnings': return TrendingUp;
      case 'Reserves': return PiggyBank;
      case 'Drawings': return MinusCircleIcon;
      default: return Landmark;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Additional Capital': return 'text-green-600 bg-green-100';
      case 'Drawings': return 'text-red-600 bg-red-100';
      case 'Reserve Transfer': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showAddCapitalForm && selectedAccount ? (
        <AddCapitalForm
          account={selectedAccount}
          onCancel={() => {
            setShowAddCapitalForm(false);
            setSelectedAccount(null);
          }}
          onSave={handleAddCapital}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : showDrawingsForm && selectedAccount ? (
        <RecordDrawingsForm
          account={selectedAccount}
          onCancel={() => {
            setShowDrawingsForm(false);
            setSelectedAccount(null);
          }}
          onSave={handleRecordDrawings}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : showTransactionForm ? (
        <AddTransactionForm
          onCancel={() => setShowTransactionForm(false)}
          onAddCapital={(data: TransactionFormData) => {
            const capitalAccount = equityAccounts.find(a => a.accountType === 'Capital');
            if (capitalAccount) {
              handleAddCapital({ ...data, accountId: capitalAccount.id });
            } else {
              toast.error('No capital account found');
            }
          }}
          onRecordDrawings={(data: TransactionFormData) => {
            const drawingsAccount = equityAccounts.find(a => a.accountType === 'Drawings');
            if (drawingsAccount) {
              handleRecordDrawings({ ...data, accountId: drawingsAccount.id });
            } else {
              toast.error('No drawings account found');
            }
          }}
          onTransfer={handleTransferToRetainedEarnings}
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
                <Landmark className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Capital & Equity
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
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Equity</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalEquity)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Capital</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalCapital)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Retained Earnings</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalRetainedEarnings)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Drawings</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalDrawings)}</p>
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
                    value={filter.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Equity Account List */}
          <div className="space-y-3 md:space-y-4">
            {loading && equityAccounts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading equity accounts...</p>
              </div>
            ) : equityAccounts.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Landmark className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No equity accounts found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              equityAccounts.map((account) => {
                const typeColor = getTypeColor(account.accountType);
                const Icon = getTypeIcon(account.accountType);
                const isCapital = account.accountType === 'Capital';
                const isDrawings = account.accountType === 'Drawings';

                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewAccountDetail(account)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{account.accountName}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full ${typeColor}`}>
                              {account.accountType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{account.accountCode}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">Updated: {formatDate(account.lastUpdated)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-purple-600">{formatCurrency(account.currentBalance)}</p>
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
          {pagination.hasNext && equityAccounts.length > 0 && (
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
      {selectedAccount && !showAddCapitalForm && !showDrawingsForm && !showTransactionForm && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onAddCapital={() => setShowAddCapitalForm(true)}
          onRecordDrawings={() => setShowDrawingsForm(true)}
          transactions={transactions.filter(t => t.accountId === selectedAccount.id)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getTypeColor={getTypeColor}
          getTypeIcon={getTypeIcon}
          getTransactionTypeColor={getTransactionTypeColor}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD CAPITAL FORM
// ═══════════════════════════════════════════════════════════════

function AddCapitalForm({
  account,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    paymentMethod: 'Cash',
    bankAccountId: ''
  });
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<{ id: string; accountName: string }[]>([]);

  useEffect(() => {
    equityService.getBankAccounts().then(setBanks);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError('Please select a bank account');
      return;
    }
    setError('');

    onSave({
      accountId: account.id,
      amount: amount,
      description: formData.description,
      reference: formData.reference,
      paymentMethod: formData.paymentMethod,
      bankAccountId: formData.paymentMethod === 'Cash' ? null : formData.bankAccountId
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Capital</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{account.accountName}</p>
          <p className="text-xs text-gray-500">
            Current Balance: <span className="font-semibold text-purple-600">{formatCurrency(account.currentBalance)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Paid via *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paymentMethod: e.target.value,
                bankAccountId: e.target.value === 'Cash' ? '' : prev.bankAccountId
              }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account *</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select bank account</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.accountName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={2}
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="e.g., CAP-001"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Add Capital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECORD DRAWINGS FORM
// ═══════════════════════════════════════════════════════════════

function RecordDrawingsForm({
  account,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    paymentMethod: 'Cash',
    bankAccountId: ''
  });
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<{ id: string; accountName: string }[]>([]);

  useEffect(() => {
    equityService.getBankAccounts().then(setBanks);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError('Please select a bank account');
      return;
    }
    setError('');

    onSave({
      accountId: account.id,
      amount: amount,
      description: formData.description,
      reference: formData.reference,
      paymentMethod: formData.paymentMethod,
      bankAccountId: formData.paymentMethod === 'Cash' ? null : formData.bankAccountId
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <MinusCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Record Drawings</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{account.accountName}</p>
          <p className="text-xs text-gray-500">
            Current Balance: <span className="font-semibold text-red-600">{formatCurrency(account.currentBalance)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Paid via *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paymentMethod: e.target.value,
                bankAccountId: e.target.value === 'Cash' ? '' : prev.bankAccountId
              }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account *</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select bank account</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.accountName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={2}
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="e.g., DRW-001"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-red-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Record Drawings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD TRANSACTION FORM
// ═══════════════════════════════════════════════════════════════

function AddTransactionForm({
  onCancel,
  onAddCapital,
  onRecordDrawings,
  onTransfer,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    transactionType: 'Additional Capital',
    amount: '',
    description: '',
    reference: ''
  });
  const [error, setError] = useState('');

  const transactionTypes = ['Additional Capital', 'Drawings', 'Reserve Transfer'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    setError('');

    const data = {
      amount: amount,
      description: formData.description,
      reference: formData.reference
    };

    switch (formData.transactionType) {
      case 'Additional Capital':
        onAddCapital(data);
        break;
      case 'Drawings':
        onRecordDrawings(data);
        break;
      case 'Reserve Transfer':
        onTransfer(data);
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Plus className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Equity Transaction</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Transaction Type *</label>
            <select
              value={formData.transactionType}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {transactionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={2}
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="e.g., REF-001"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
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
              Save Transaction
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
  onAddCapital,
  onRecordDrawings,
  transactions,
  formatCurrency,
  formatDate,
  getTypeColor,
  getTypeIcon,
  getTransactionTypeColor
}: any) {
  const typeColor = getTypeColor(account.accountType);
  const Icon = getTypeIcon(account.accountType);
  const isCapital = account.accountType === 'Capital';
  const isDrawings = account.accountType === 'Drawings';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{account.accountName}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${typeColor}`}>
                  {account.accountType}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{account.accountCode}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-4 gap-3 md:gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Opening</p>
              <p className="text-lg md:text-xl font-bold text-gray-700">{formatCurrency(account.openingBalance)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Additions</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(account.additions)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Withdrawals</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(account.withdrawals)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Balance</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{formatCurrency(account.currentBalance)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Account Type</span>
              <span className="text-sm font-medium text-gray-800">{account.accountType}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Account Code</span>
              <span className="text-sm font-medium text-gray-800">{account.accountCode}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Opening Balance</span>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(account.openingBalance)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Total Additions</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(account.additions)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Total Withdrawals</span>
              <span className="text-sm font-medium text-red-600">{formatCurrency(account.withdrawals)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Current Balance</span>
              <span className="text-sm font-bold text-purple-600">{formatCurrency(account.currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Last Updated</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(account.lastUpdated)}</span>
            </div>
            {account.notes && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <span className="text-sm font-medium text-gray-800">{account.notes}</span>
              </div>
            )}
          </div>

          {/* Transactions */}
          {transactions.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Transactions</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.slice(0, 5).map((txn: OwnerTransaction, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(txn.transactionDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${txn.transactionType === 'Additional Capital' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.transactionType === 'Additional Capital' ? '+' : '-'} {formatCurrency(txn.amount)}
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getTransactionTypeColor(txn.transactionType)}`}>
                        {txn.transactionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {isCapital && (
                <button
                  onClick={onAddCapital}
                  className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Add Capital
                </button>
              )}
              {isDrawings && (
                <button
                  onClick={onRecordDrawings}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                >
                  <MinusCircleIcon className="w-4 h-4" />
                  Record Drawings
                </button>
              )}
              {!isCapital && !isDrawings && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}