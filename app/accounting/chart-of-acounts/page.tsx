'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, CreditCard, Users,
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
  Edit, Archive, MoreVertical, Info, Layers
} from 'lucide-react';
import { chartOfAccountService, ChartOfAccount, ChartOfAccountStats } from '../../../lib/chart-of-accounts-service';


interface AccountTypeStats {
  total: number;
  types: {
    Asset: number;
    Liability: number;
    Equity: number;
    Revenue: number;
    Expense: number;
  };
  issues?: {
    hasIssues: boolean;
    incorrectCashAccounts: number;
  };
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<ChartOfAccountStats>({
    total: 0,
    assetTotal: 0,
    liabilityTotal: 0,
    equityTotal: 0,
    revenueTotal: 0,
    expenseTotal: 0
  });
  const [typeStats, setTypeStats] = useState<AccountTypeStats | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [viewingAccount, setViewingAccount] = useState<ChartOfAccount | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToActOn, setAccountToActOn] = useState<string | null>(null);
  const [showFixAccounts, setShowFixAccounts] = useState(false);

  const filters = ['All', 'Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];
  const searchInputRef = useRef<HTMLInputElement>(null);


  const fetchAccounts = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await chartOfAccountService.getAccounts({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        type: selectedFilter !== 'All' ? selectedFilter : undefined
      });

      setAccounts(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
      if (response.typeStats) {
        setTypeStats(response.typeStats);
      }
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      alert(error.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFilter, pagination.page, pagination.limit]);


  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await chartOfAccountService.getAccounts({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        type: selectedFilter !== 'All' ? selectedFilter : undefined
      });

      setAccounts(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more accounts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, selectedFilter]);


  useEffect(() => {
    fetchAccounts(true);
  }, []);


  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchAccounts(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchAccounts(true);
  };


  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    fetchAccounts(true);
  };

  const handleRefresh = () => {
    fetchAccounts(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchAccounts(false);
  };


  const handleCreateAccount = async (data: Partial<ChartOfAccount>) => {
    setSubmitting(true);
    try {
      await chartOfAccountService.createAccount(data);
      setShowCreateForm(false);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to create account:', error);
      alert(error.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAccount = async (id: string, data: Partial<ChartOfAccount>) => {
    setSubmitting(true);
    try {
      await chartOfAccountService.updateAccount(id, data);
      setEditingAccount(null);
      setViewingAccount(null);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to update account:', error);
      alert(error.message || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToActOn) return;
    setSubmitting(true);
    try {
      await chartOfAccountService.deleteAccount(accountToActOn);
      setShowDeleteConfirm(false);
      setAccountToActOn(null);
      setViewingAccount(null);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      alert(error.message || 'Failed to delete account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveAccount = async (id: string, isActive: boolean) => {
    setSubmitting(true);
    try {
      await chartOfAccountService.archiveAccount(id, isActive);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to archive account:', error);
      alert(error.message || 'Failed to archive account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixCashAccounts = async () => {
    setSubmitting(true);
    try {
      await chartOfAccountService.fixCashAccounts();
      setShowFixAccounts(false);
      fetchAccounts(true);
    } catch (error: any) {
      console.error('Failed to fix cash accounts:', error);
      alert(error.message || 'Failed to fix cash accounts');
    } finally {
      setSubmitting(false);
    }
  };


  const viewAccountDetail = (account: ChartOfAccount) => {
    setViewingAccount(account);
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Asset': return Landmark;
      case 'Liability': return CreditCard;
      case 'Equity': return Wallet;
      case 'Revenue': return TrendingUp;
      case 'Expense': return TrendingDown;
      default: return Landmark;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'text-green-600 bg-green-50';
      case 'Liability': return 'text-red-600 bg-red-50';
      case 'Equity': return 'text-blue-600 bg-blue-50';
      case 'Revenue': return 'text-emerald-600 bg-emerald-50';
      case 'Expense': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBalanceType = (type: string) => {
    return (type === 'Asset' || type === 'Expense') ? 'Debit' : 'Credit';
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm || editingAccount ? (
        <AccountForm
          editingAccount={editingAccount}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingAccount(null);
          }}
          onSave={(data) => editingAccount ? handleUpdateAccount(editingAccount.id, data) : handleCreateAccount(data)}
          submitting={submitting}
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
                <Landmark className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
                Chart of Accounts
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} accounts)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {typeStats?.issues?.hasIssues && (
                <button
                  onClick={() => setShowFixAccounts(true)}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs md:text-sm font-medium hover:bg-orange-200 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden xs:inline">{typeStats.issues.incorrectCashAccounts} issues</span>
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#7c4dff] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Account</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Accounts</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Assets</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(stats.assetTotal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Liabilities</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(stats.liabilityTotal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Equity</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(stats.equityTotal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Revenue</p>
              <p className="text-lg md:text-xl font-bold text-emerald-600 mt-0.5 md:mt-1">{formatCurrency(stats.revenueTotal)}</p>
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
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
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
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    {filters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {loading && accounts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Landmark className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No accounts found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              accounts.map((account) => {
                const Icon = getTypeIcon(account.type);
                const colorClass = getTypeColor(account.type);
                const balanceType = getBalanceType(account.type);
                const isIncorrect = account.type !== 'Asset' && 
                  (account.name?.toLowerCase().includes('cash') || 
                   account.name?.toLowerCase().includes('bank') ||
                   account.name?.toLowerCase().includes('money'));

                return (
                  <div
                    key={account.id}
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
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{account.name}</p>
                            {isIncorrect && (
                              <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs font-mono font-semibold text-[#7c4dff] bg-[#7c4dff]/10 px-1.5 md:px-2 py-0.5 rounded">
                              {account.code}
                            </span>
                            <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${getStatusColor(account.isActive)}`}>
                              {account.isActive ? 'Active' : 'Archived'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm md:text-base font-bold ${balanceType === 'Debit' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(account.balance)}
                          </p>
                          <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full ${balanceType === 'Debit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {balanceType}
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
        </>
      )}

      {viewingAccount && (
        <AccountDetailModal
          account={viewingAccount}
          onClose={() => setViewingAccount(null)}
          onEdit={() => {
            setEditingAccount(viewingAccount);
            setViewingAccount(null);
          }}
          onArchive={() => handleArchiveAccount(viewingAccount.id, !viewingAccount.isActive)}
          onDelete={() => {
            setAccountToActOn(viewingAccount.id);
            setShowDeleteConfirm(true);
            setViewingAccount(null);
          }}
          onFixType={() => {
            handleUpdateAccount(viewingAccount.id, { type: 'Asset' });
          }}
          formatCurrency={formatCurrency}
          getTypeIcon={getTypeIcon}
          getTypeColor={getTypeColor}
          getBalanceType={getBalanceType}
          submitting={submitting}
        />
      )}

      {showFixAccounts && (
        <ConfirmationModal
          title="Fix Cash Accounts"
          message="Some cash/bank accounts have incorrect account types. Cash and Bank accounts should be of type 'Assets'. Do you want to automatically fix all incorrect cash/bank accounts?"
          confirmLabel="Fix All"
          confirmColor="bg-orange-500 hover:bg-orange-600"
          onConfirm={handleFixCashAccounts}
          onCancel={() => setShowFixAccounts(false)}
          loading={submitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Account"
          message="Are you sure you want to delete this account? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setAccountToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

function AccountForm({
  editingAccount,
  onCancel,
  onSave,
  submitting
}: {
  editingAccount?: ChartOfAccount | null;
  onCancel: () => void;
  onSave: (data: Partial<ChartOfAccount>) => void;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState<Partial<ChartOfAccount>>({
    name: editingAccount?.name || '',
    code: editingAccount?.code || '',
    type: editingAccount?.type || 'Asset',
    parentAccount: editingAccount?.parentAccount || '',
    description: editingAccount?.description || '',
    taxCode: editingAccount?.taxCode || 'N/A',
    balance: editingAccount?.balance || 0,
    isActive: editingAccount?.isActive !== undefined ? editingAccount.isActive : true
  });

  const [error, setError] = useState('');
  const [typeError, setTypeError] = useState('');

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
  const parentAccountsMap: Record<string, string[]> = {
    'Asset': ['Current Assets', 'Fixed Assets'],
    'Liability': ['Current Liabilities', 'Long Term Liabilities'],
    'Equity': ['Capital / Equity'],
    'Revenue': ['Operating Income'],
    'Expense': ['Operating Expenses']
  };
  const taxOptions = ['N/A', 'GST-13%', 'GST-5%', 'WHT-10%'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.code?.trim()) {
      setError('Account code is required');
      return;
    }
    if (typeError) {
      setError(typeError);
      return;
    }
    setError('');
    
    const nameLower = (formData.name || '').toLowerCase();
    const isCashOrBank = nameLower.includes('cash') || nameLower.includes('bank') || nameLower.includes('money');
    
    if (isCashOrBank && formData.type !== 'Asset') {
      setTypeError('Cash/Bank accounts must be of type "Asset"');
      return;
    }
    
    onSave(formData);
  };

  const handleTypeChange = (type: ChartOfAccount['type']) => {
    setFormData(prev => ({ ...prev, type, parentAccount: '' }));
    
    const nameLower = (formData.name || '').toLowerCase();
    const isCashOrBank = nameLower.includes('cash') || nameLower.includes('bank') || nameLower.includes('money');
    
    if (isCashOrBank && type !== 'Asset') {
      setTypeError('Cash/Bank accounts must be of type "Asset"');
    } else {
      setTypeError('');
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    const nameLower = name.toLowerCase();
    const isCashOrBank = nameLower.includes('cash') || nameLower.includes('bank') || nameLower.includes('money');
    
    if (isCashOrBank && formData.type !== 'Asset') {
      setTypeError('Cash/Bank accounts must be of type "Asset"');
    } else {
      setTypeError('');
    }
  };

  const isEditing = !!editingAccount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Landmark className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">
            {isEditing ? 'Edit Account' : 'Add New Account'}
          </h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {typeError && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {typeError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                Account Code *
              </label>
              <input
                type="text"
                placeholder="e.g., 1010"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                Account Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Cash in Hand"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                Account Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as ChartOfAccount['type'])}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                Parent Account
              </label>
              <select
                value={formData.parentAccount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, parentAccount: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">None</option>
                {(parentAccountsMap[formData.type || 'Asset'] || []).map((parent) => (
                  <option key={parent} value={parent}>{parent}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Opening Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">Rs.</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Tax Code
            </label>
            <select
              value={formData.taxCode || 'N/A'}
              onChange={(e) => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              {taxOptions.map((tax) => (
                <option key={tax} value={tax}>{tax}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Account description..."
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-[#7c4dff] rounded border-gray-300 focus:ring-[#7c4dff]"
            />
            <label className="text-xs md:text-sm font-medium text-gray-700">Active</label>
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              {isEditing ? 'Update Account' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountDetailModal({
  account,
  onClose,
  onEdit,
  onArchive,
  onDelete,
  onFixType,
  formatCurrency,
  getTypeIcon,
  getTypeColor,
  getBalanceType,
  submitting
}: any) {
  const Icon = getTypeIcon(account.type);
  const colorClass = getTypeColor(account.type);
  const balanceType = getBalanceType(account.type);
  const isIncorrect = account.type !== 'Asset' && 
    (account.name?.toLowerCase().includes('cash') || 
     account.name?.toLowerCase().includes('bank') ||
     account.name?.toLowerCase().includes('money'));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#7c4dff]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${colorClass}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{account.name}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className="font-mono text-[10px] md:text-xs font-bold text-[#7c4dff] bg-[#7c4dff]/10 px-1.5 md:px-2 py-0.5 rounded">
                  {account.code}
                </span>
                <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {account.isActive ? 'Active' : 'Archived'}
                </span>
                <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full ${balanceType === 'Debit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {balanceType}
                </span>
                {isIncorrect && (
                  <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Incorrect Type
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-gray-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Balance</p>
              <p className={`text-base md:text-lg font-bold ${balanceType === 'Debit' ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(account.balance)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Account Type</p>
              <p className="text-base md:text-lg font-bold text-gray-800">{account.type}</p>
            </div>
          </div>

          <div className="space-y-3">
            {account.parentAccount && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Parent Account</span>
                <span className="text-sm font-medium text-gray-800">{account.parentAccount}</span>
              </div>
            )}
            {account.taxCode && account.taxCode !== 'N/A' && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Tax Code</span>
                <span className="text-sm font-medium text-gray-800">{account.taxCode}</span>
              </div>
            )}
            {account.description && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Description</span>
                <span className="text-sm font-medium text-gray-800">{account.description}</span>
              </div>
            )}
          </div>

          {isIncorrect && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                This is a cash/bank account but type is "{account.type}". It should be "Asset".
              </p>
              <button
                onClick={onFixType}
                disabled={submitting}
                className="mt-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                Fix Account Type
              </button>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4 flex flex-wrap gap-2">
            <button
              onClick={onEdit}
              className="flex-1 min-w-[80px] px-3 md:px-4 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Edit
            </button>
            <button
              onClick={onArchive}
              disabled={submitting}
              className="flex-1 min-w-[80px] px-3 md:px-4 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Archive className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {account.isActive ? 'Archive' : 'Activate'}
            </button>
            <button
              onClick={onDelete}
              disabled={submitting}
              className="flex-1 min-w-[80px] px-3 md:px-4 py-2 md:py-2.5 border border-red-500 text-red-500 rounded-lg text-xs md:text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  loading,
  extraContent
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  extraContent?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl mx-3 md:mx-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">{message}</p>
          {extraContent}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${confirmColor}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}