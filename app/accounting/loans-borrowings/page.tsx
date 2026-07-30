'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Shield as Security, Wrench as Build, Monitor as Computer, Receipt as ReceiptIcon2,
  UserCircle, PhoneCall, Mail as MailIcon, FileText as FileTextIcon2,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  CarFront as Car,
  User as Person,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { loansService, Loan, Summary, BankAccount, EMIPayment } from '../../api/loans-borrowings/route';
import { toast } from 'react-hot-toast';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function LoansBorrowingsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
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
  const [summary, setSummary] = useState<Summary>({
    totalLoans: 0,
    totalPrincipal: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    totalEMI: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    search: ''
  });
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Active', 'Fully Paid', 'Overdue', 'Defaulted'];
  const loanTypeOptions = ['Bank Loan', 'Business Loan', 'Vehicle Loan', 'Personal Loan', 'Overdraft', 'Lease Financing'];

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

  // ─── Fetch Loans ─────────────────────────────────────────────

  const fetchLoans = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await loansService.getLoans({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setLoans(response.data || []);
      setPagination(response.pagination);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error: any) {
      console.error('Failed to fetch loans:', error);
      toast.error(error.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await loansService.getBankAccounts();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await loansService.getSummary();
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
      const response = await loansService.getLoans({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setLoans(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more loans:', error);
      toast.error('Failed to load more loans');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchBankAccounts();
    fetchSummary();
    fetchLoans(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setFilter(prev => ({ ...prev, search: query }));
    fetchLoans(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilter(prev => ({ ...prev, search: '' }));
    fetchLoans(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchLoans(true);
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchLoans(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchLoans(false);
  };

  // ─── Create Loan ─────────────────────────────────────────────

  const handleCreateLoan = async (data: any) => {
    setSubmitting(true);
    try {
      await loansService.createLoan(data);
      toast.success('Loan created successfully!');
      setShowCreateForm(false);
      fetchSummary();
      fetchLoans(true);
    } catch (error: any) {
      console.error('Failed to create loan:', error);
      toast.error(error.message || 'Failed to create loan');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Record Payment ──────────────────────────────────────────

  const handleRecordPayment = async (data: any) => {
    setSubmitting(true);
    try {
      await loansService.recordPayment(data);
      toast.success('Payment recorded successfully!');
      setShowPaymentForm(false);
      setSelectedLoan(null);
      fetchSummary();
      fetchLoans(true);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Loan Detail ───────────────────────────────────────

  const viewLoanDetail = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  // ─── View Payment Schedule ──────────────────────────────────

  const viewPaymentSchedule = async (loan: Loan) => {
    try {
      const schedule = await loansService.getPaymentSchedule(loan.id);
      setSelectedLoan({
        ...loan,
        payments: schedule || []
      });
      setShowScheduleModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payment schedule');
    }
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fully Paid': return 'bg-green-100 text-green-700';
      case 'Active': return 'bg-blue-100 text-blue-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      case 'Defaulted': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Fully Paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Active': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Defaulted': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLoanTypeIcon = (loanType: string) => {
    switch (loanType) {
      case 'Bank Loan': return Landmark;
      case 'Business Loan': return Building;
      case 'Vehicle Loan': return Car;
      case 'Personal Loan': return Person;
      case 'Overdraft': return CreditCardIcon;
      default: return CreditCardIcon;
    }
  };

  const getLoanTypeColor = (loanType: string) => {
    switch (loanType) {
      case 'Bank Loan': return 'text-blue-600 bg-blue-100';
      case 'Business Loan': return 'text-green-600 bg-green-100';
      case 'Vehicle Loan': return 'text-orange-600 bg-orange-100';
      case 'Personal Loan': return 'text-purple-600 bg-purple-100';
      case 'Overdraft': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getRepaidPercent = (loan: Loan) => {
    if (loan.loanAmount <= 0) return 0;
    return Math.min((loan.totalPaid / loan.loanAmount) * 100, 100);
  };

  const isOverdue = (loan: Loan) => {
    return loan.nextPaymentDate && new Date(loan.nextPaymentDate) < new Date() && loan.status === 'Active';
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateLoanForm
          bankAccounts={bankAccounts}
          loanTypeOptions={loanTypeOptions}
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateLoan}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : showPaymentForm && selectedLoan ? (
        <RecordPaymentForm
          loan={selectedLoan}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedLoan(null);
          }}
          onSave={handleRecordPayment}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
          bankAccounts={bankAccounts}
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
                <CreditCardIcon className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
                Loans & Borrowings
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} loans)
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
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Loan</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Loans</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{summary.totalLoans}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Principal</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalPrincipal)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalOutstanding)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Monthly EMI</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalEMI)}</p>
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
                  placeholder="Search loans..."
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
                    value={filter.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
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

          {/* Loan List */}
          <div className="space-y-3 md:space-y-4">
            {loading && loans.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading loans...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <CreditCardIcon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No loans found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              loans.map((loan) => {
                const statusColor = getStatusColor(loan.status);
                const statusIcon = getStatusIcon(loan.status);
                const Icon = getLoanTypeIcon(loan.loanType);
                const typeColor = getLoanTypeColor(loan.loanType);
                const repaidPercent = getRepaidPercent(loan);
                const overdue = isOverdue(loan);

                return (
                  <div
                    key={loan.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewLoanDetail(loan)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{loan.loanNumber}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{loan.status}</span>
                            </span>
                            {overdue && (
                              <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{loan.lenderName}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-500">{loan.loanType}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{loan.interestRate}%</span>
                          </div>
                          {/* Repayment Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Repaid</span>
                              <span>{repaidPercent.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                              <div
                                className={`h-1.5 rounded-full ${repaidPercent >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                                style={{ width: `${Math.min(repaidPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(loan.outstandingBalance)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">Outstanding</p>
                          {loan.emiAmount > 0 && (
                            <p className="text-[10px] md:text-xs text-gray-400">EMI: {formatCurrency(loan.emiAmount)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && loans.length > 0 && (
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

      {/* Loan Detail Modal */}
      {selectedLoan && !showCreateForm && !showPaymentForm && !showScheduleModal && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onPay={() => setShowPaymentForm(true)}
          onViewSchedule={() => viewPaymentSchedule(selectedLoan)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getLoanTypeIcon={getLoanTypeIcon}
          getLoanTypeColor={getLoanTypeColor}
          isOverdue={isOverdue}
        />
      )}

      {/* Payment Schedule Modal */}
      {selectedLoan && showScheduleModal && (
        <PaymentScheduleModal
          loan={selectedLoan}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedLoan(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE LOAN FORM
// ═══════════════════════════════════════════════════════════════

function CreateLoanForm({
  bankAccounts,
  loanTypeOptions,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    loanType: 'Bank Loan',
    lenderName: '',
    loanAmount: '',
    disbursementDate: new Date().toISOString().split('T')[0],
    interestRate: '',
    tenureMonths: '12',
    purpose: '',
    collateral: '',
    accountNumber: '',
    bankAccountId: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lenderName.trim()) {
      setError('Lender name is required');
      return;
    }
    const amount = parseFloat(formData.loanAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid loan amount');
      return;
    }
    const rate = parseFloat(formData.interestRate);
    if (isNaN(rate) || rate < 0) {
      setError('Please enter a valid interest rate');
      return;
    }
    const tenure = parseInt(formData.tenureMonths);
    if (isNaN(tenure) || tenure <= 0) {
      setError('Please enter a valid tenure');
      return;
    }
    setError('');

    onSave({
      loanType: formData.loanType,
      lenderName: formData.lenderName,
      loanAmount: amount,
      disbursementDate: new Date(formData.disbursementDate),
      interestRate: rate,
      tenureMonths: tenure,
      purpose: formData.purpose,
      collateral: formData.collateral,
      accountNumber: formData.accountNumber,
      bankAccountId: formData.bankAccountId || undefined,
      notes: formData.notes
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <CreditCardIcon className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add New Loan</h2>
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
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Loan Type *</label>
            <select
              value={formData.loanType}
              onChange={(e) => setFormData(prev => ({ ...prev, loanType: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              {loanTypeOptions.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Lender/Bank Name *</label>
            <input
              type="text"
              placeholder="Enter lender name"
              value={formData.lenderName}
              onChange={(e) => setFormData(prev => ({ ...prev, lenderName: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Loan Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.loanAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, loanAmount: e.target.value }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Disbursement Date *</label>
            <input
              type="date"
              value={formData.disbursementDate}
              onChange={(e) => setFormData(prev => ({ ...prev, disbursementDate: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.interestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Tenure (months) *</label>
              <input
                type="number"
                min="1"
                placeholder="12"
                value={formData.tenureMonths}
                onChange={(e) => setFormData(prev => ({ ...prev, tenureMonths: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Purpose</label>
            <input
              type="text"
              placeholder="Purpose of loan"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Collateral</label>
            <input
              type="text"
              placeholder="Collateral/security provided"
              value={formData.collateral}
              onChange={(e) => setFormData(prev => ({ ...prev, collateral: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Account Number</label>
            <input
              type="text"
              placeholder="Loan account number"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
            <select
              value={formData.bankAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select bank account (optional)</option>
              {bankAccounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} - {acc.accountNumber} (Balance: {formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Add Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECORD PAYMENT FORM
// ═══════════════════════════════════════════════════════════════

function RecordPaymentForm({
  loan,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol,
  bankAccounts
}: any) {
  const [formData, setFormData] = useState({
    amount: loan?.emiAmount || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    type: 'EMI',
    bankAccountId: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > loan.outstandingBalance) {
      setError(`Amount cannot exceed outstanding balance: ${formatCurrency(loan.outstandingBalance)}`);
      return;
    }
    setError('');

    onSave({
      loanId: loan.id,
      amount: amount,
      paymentDate: new Date(formData.paymentDate),
      reference: formData.reference,
      notes: formData.notes,
      type: formData.type,
      bankAccountId: formData.bankAccountId || undefined
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <CreditCardIcon className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Record Payment</h2>
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
          <p className="text-sm font-medium text-gray-700">{loan.loanNumber}</p>
          <p className="text-xs text-gray-500">Lender: {loan.lenderName}</p>
          <p className="text-xs text-gray-500">
            Outstanding: <span className="font-semibold text-red-600">{formatCurrency(loan.outstandingBalance)}</span>
          </p>
          <p className="text-xs text-gray-500">
            EMI: <span className="font-semibold text-yellow-600">{formatCurrency(loan.emiAmount)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={loan.outstandingBalance}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Date *</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
            <select
              value={formData.bankAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select bank account (optional)</option>
              {bankAccounts?.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} - {acc.accountNumber} (Balance: {formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="EMI">EMI Payment</option>
              <option value="Prepayment">Prepayment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="Reference number"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
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
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOAN DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function LoanDetailModal({
  loan,
  onClose,
  onPay,
  onViewSchedule,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getLoanTypeIcon,
  getLoanTypeColor,
  isOverdue
}: any) {
  const statusColor = getStatusColor(loan.status);
  const statusIcon = getStatusIcon(loan.status);
  const Icon = getLoanTypeIcon(loan.loanType);
  const typeColor = getLoanTypeColor(loan.loanType);
  const overdue = isOverdue(loan);
  const repaidPercent = loan.loanAmount > 0 ? (loan.totalPaid / loan.loanAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${typeColor}`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{loan.loanNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {loan.status}
                </span>
                {overdue && (
                  <span className="text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{loan.loanType}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Amount</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(loan.loanAmount)}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">EMI</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600">{formatCurrency(loan.emiAmount)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(loan.outstandingBalance)}</p>
            </div>
          </div>

          {/* Repayment Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Repaid</span>
              <span>{repaidPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${repaidPercent >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(repaidPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Lender</span>
              <span className="text-sm font-medium text-gray-800">{loan.lenderName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Disbursement Date</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(loan.disbursementDate)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Interest Rate</span>
              <span className="text-sm font-medium text-gray-800">{loan.interestRate}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Tenure</span>
              <span className="text-sm font-medium text-gray-800">{loan.tenureMonths} months</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Total Paid</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(loan.totalPaid)}</span>
            </div>
            {loan.nextPaymentDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Next Payment</span>
                <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatDate(loan.nextPaymentDate)}
                  {overdue && ' (Overdue)'}
                </span>
              </div>
            )}
            {loan.lastPaymentDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Last Payment</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(loan.lastPaymentDate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Purpose</span>
              <span className="text-sm font-medium text-gray-800">{loan.purpose || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Collateral</span>
              <span className="text-sm font-medium text-gray-800">{loan.collateral || 'None'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Account Number</span>
              <span className="text-sm font-medium text-gray-800">{loan.accountNumber || '-'}</span>
            </div>
            {loan.notes && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <span className="text-sm font-medium text-gray-800">{loan.notes}</span>
              </div>
            )}
          </div>

          {/* Payment History */}
          {loan.payments && loan.payments.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Payment History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loan.payments.map((payment: EMIPayment, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{formatDate(payment.date)}</p>
                      <p className="text-xs text-gray-400">{payment.type || 'EMI'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                        {payment.status}
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
              {loan.status === 'Active' && (
                <button
                  onClick={onPay}
                  className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  Pay EMI
                </button>
              )}
              <button
                onClick={onViewSchedule}
                className="flex-1 px-4 py-2.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                View Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE MODAL
// ═══════════════════════════════════════════════════════════════

function PaymentScheduleModal({
  loan,
  onClose,
  formatCurrency,
  formatDate
}: any) {
  const payments = loan.payments || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Payment Schedule</h2>
            <p className="text-sm text-gray-500">{loan.loanNumber} - {loan.lenderName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payment schedule available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment: any, index: number) => {
                const statusColor = payment.status === 'Paid' 
                  ? 'text-green-600 bg-green-100' 
                  : payment.status === 'Overdue' 
                  ? 'text-red-600 bg-red-100' 
                  : 'text-blue-600 bg-blue-100';

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Installment #{payment.installmentNo || index + 1}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(payment.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{formatCurrency(payment.emiAmount || payment.amount || 0)}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColor}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}