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
  CheckCircle as CheckCircleIcon
} from 'lucide-react';
import { paymentsMadeService, PaymentMade, Summary, Supplier, BankAccount, BillForPayment } from '../../api/payments-made/route';
import { toast } from 'react-hot-toast';


interface FilterState {
  period: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function PaymentsMadePage() {
  const [payments, setPayments] = useState<PaymentMade[]>([]);
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
    totalPaid: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    pending: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    period: 'All',
    search: ''
  });
  const [selectedPayment, setSelectedPayment] = useState<PaymentMade | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<BillForPayment[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const periodOptions = ['All', 'Today', 'This Week', 'This Month'];

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

  // ─── Fetch Payments ──────────────────────────────────────────

  const fetchPayments = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await paymentsMadeService.getPayments({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        period: filter.period !== 'All' ? filter.period : undefined
      });

      setPayments(response.data || []);
      setPagination(response.pagination);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      toast.error(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Suppliers ─────────────────────────────────────────

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await paymentsMadeService.getSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  }, []);

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await paymentsMadeService.getBankAccounts();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  // ─── Fetch Unpaid Bills ──────────────────────────────────────

  const fetchUnpaidBills = useCallback(async (supplierId: string) => {
    try {
      const data = await paymentsMadeService.getUnpaidBills(supplierId);
      setUnpaidBills(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch unpaid bills:', error);
      setUnpaidBills([]);
      return [];
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await paymentsMadeService.getSummary();
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
      const response = await paymentsMadeService.getPayments({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        period: filter.period !== 'All' ? filter.period : undefined
      });

      setPayments(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more payments:', error);
      toast.error('Failed to load more payments');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchSuppliers();
    fetchBankAccounts();
    fetchSummary();
    fetchPayments(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setFilter(prev => ({ ...prev, search: query }));
    fetchPayments(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilter(prev => ({ ...prev, search: '' }));
    fetchPayments(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handlePeriodChange = (period: string) => {
    setFilter(prev => ({ ...prev, period }));
    fetchPayments(true);
    fetchSummary();
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchPayments(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchPayments(false);
  };

  // ─── Record Payment ──────────────────────────────────────────

  const handleRecordPayment = async (data: any) => {
    setSubmitting(true);
    try {
      await paymentsMadeService.recordPayment(data);
      toast.success('Payment recorded successfully!');
      setShowPaymentForm(false);
      setSelectedPayment(null);
      fetchSummary();
      fetchPayments(true);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Clear Cheque ────────────────────────────────────────────

  const handleClearCheque = async (paymentId: string) => {
    if (!confirm('Clear this cheque payment?')) return;
    try {
      await paymentsMadeService.clearCheque(paymentId);
      toast.success('Cheque cleared successfully!');
      fetchPayments(true);
      fetchSummary();
    } catch (error: any) {
      console.error('Failed to clear cheque:', error);
      toast.error(error.message || 'Failed to clear cheque');
    }
  };

  // ─── Delete Payment ──────────────────────────────────────────

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment? This will reverse the journal entry.')) return;
    try {
      await paymentsMadeService.deletePayment(paymentId);
      toast.success('Payment deleted successfully!');
      fetchPayments(true);
      fetchSummary();
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  // ─── View Payment Detail ─────────────────────────────────────

  const viewPaymentDetail = (payment: PaymentMade) => {
    setSelectedPayment(payment);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cleared':
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Cleared':
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showPaymentForm ? (
        <RecordPaymentForm
          suppliers={suppliers}
          bankAccounts={bankAccounts}
          unpaidBills={unpaidBills}
          onCancel={() => {
            setShowPaymentForm(false);
            setUnpaidBills([]);
          }}
          onSave={handleRecordPayment}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
          fetchUnpaidBills={fetchUnpaidBills}
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
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Payments Made
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} payments)
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
                onClick={() => {
                  setUnpaidBills([]);
                  setShowPaymentForm(true);
                }}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Record Payment</span>
                <span className="sm:hidden">Record</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Paid</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalPaid)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">This Month</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.thisMonth)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">This Week</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(summary.thisWeek)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Pending</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{summary.pending}</p>
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
                  placeholder="Search payments..."
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
                    value={filter.period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {periodOptions.map((period) => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment List */}
          <div className="space-y-3 md:space-y-4">
            {loading && payments.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <DollarSign className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No payments found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              payments.map((payment) => {
                const statusColor = getStatusColor(payment.status);
                const statusIcon = getStatusIcon(payment.status);

                return (
                  <div
                    key={payment.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewPaymentDetail(payment)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-2.5 rounded-xl bg-red-100">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{payment.paymentNumber}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{payment.status}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{payment.supplierName}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">Bill: {payment.billNumber}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{payment.paymentMethod}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{formatDate(payment.paymentDate)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">Paid</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && payments.length > 0 && (
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

      {/* Payment Detail Modal */}
      {selectedPayment && !showPaymentForm && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onClearCheque={handleClearCheque}
          onDelete={handleDeletePayment}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECORD PAYMENT FORM
// ═══════════════════════════════════════════════════════════════

function RecordPaymentForm({
  suppliers,
  bankAccounts,
  unpaidBills,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol,
  fetchUnpaidBills
}: any) {
  const [formData, setFormData] = useState({
    supplierId: '',
    billIds: [] as string[],
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    reference: '',
    bankAccountId: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  const handleSupplierChange = async (supplierId: string) => {
    setFormData(prev => ({ ...prev, supplierId, billIds: [], amount: '' }));
    setSelectedBills(new Set());
    setTotalOutstanding(0);
    if (supplierId) {
      setIsLoadingBills(true);
      const bills = await fetchUnpaidBills(supplierId);
      setIsLoadingBills(false);
    }
  };

  const toggleBillSelection = (billId: string, outstanding: number) => {
    const newSelected = new Set(selectedBills);
    let newTotal = totalOutstanding;
    
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
      newTotal -= outstanding;
    } else {
      newSelected.add(billId);
      newTotal += outstanding;
    }
    
    setSelectedBills(newSelected);
    setTotalOutstanding(newTotal);
    setFormData(prev => ({
      ...prev,
      billIds: Array.from(newSelected),
      amount: newTotal.toString()
    }));
  };

  const selectAllBills = () => {
    const allSelected = new Set<string>();
    let total = 0;
    unpaidBills.forEach((bill: any) => {
      allSelected.add(bill.id);
      total += bill.outstanding;
    });
    setSelectedBills(allSelected);
    setTotalOutstanding(total);
    setFormData(prev => ({
      ...prev,
      billIds: Array.from(allSelected),
      amount: total.toString()
    }));
  };

  const deselectAllBills = () => {
    setSelectedBills(new Set());
    setTotalOutstanding(0);
    setFormData(prev => ({
      ...prev,
      billIds: [],
      amount: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (formData.billIds.length === 0) {
      setError('Please select at least one bill');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > totalOutstanding) {
      setError('Amount cannot exceed total outstanding');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError(`Please select a bank account for ${formData.paymentMethod}`);
      return;
    }
    setError('');

    onSave({
      supplierId: formData.supplierId,
      billIds: formData.billIds,
      amount: amount,
      paymentDate: new Date(formData.paymentDate),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      bankAccountId: formData.paymentMethod !== 'Cash' ? formData.bankAccountId : null,
      notes: formData.notes
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Record Payment</h2>
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
          {/* Supplier */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Supplier *</label>
            <select
              value={formData.supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s: Supplier) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Bills Selection */}
          {formData.supplierId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700">Select Bills *</label>
                {unpaidBills.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectedBills.size === unpaidBills.length ? deselectAllBills : selectAllBills}
                      className="text-xs text-[#014582] font-medium hover:text-purple-700"
                    >
                      {selectedBills.size === unpaidBills.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-xs text-gray-400">
                      {selectedBills.size} selected
                    </span>
                  </div>
                )}
              </div>

              {isLoadingBills ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
                </div>
              ) : unpaidBills.length === 0 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-sm">
                  No unpaid bills for this supplier
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {unpaidBills.map((bill: any) => (
                    <div
                      key={bill.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedBills.has(bill.id)
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleBillSelection(bill.id, bill.outstanding)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{bill.billNumber}</p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(bill.dueDate).toLocaleDateString()} • Outstanding: {formatCurrency(bill.outstanding)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(bill.outstanding)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount */}
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
            {totalOutstanding > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Max: {formatCurrency(totalOutstanding)}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Date *</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value, bankAccountId: '' }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          {/* Bank Account */}
          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">From Bank Account *</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              >
                <option value="">Select bank account...</option>
                {bankAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} - {acc.number} (Balance: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reference */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="Reference number"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-red-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
// PAYMENT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function PaymentDetailModal({
  payment,
  onClose,
  onClearCheque,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon
}: any) {
  const statusColor = getStatusColor(payment.status);
  const statusIcon = getStatusIcon(payment.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-red-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-red-100">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{payment.paymentNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {payment.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(payment.paymentDate)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Amount</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Bill</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{payment.billNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Method</p>
              <p className="text-lg md:text-xl font-bold text-gray-700">{payment.paymentMethod}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Supplier</span>
              <span className="text-sm font-medium text-gray-800">{payment.supplierName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Bill Number</span>
              <span className="text-sm font-medium text-gray-800">{payment.billNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Bill Amount</span>
              <span className="text-sm font-medium text-purple-600">{formatCurrency(payment.billAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Payment Method</span>
              <span className="text-sm font-medium text-gray-800">{payment.paymentMethod}</span>
            </div>
            {payment.reference && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Reference</span>
                <span className="text-sm font-medium text-gray-800">{payment.reference}</span>
              </div>
            )}
            {payment.bankAccountName && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Bank Account</span>
                <span className="text-sm font-medium text-gray-800">{payment.bankAccountName}</span>
              </div>
            )}
            {payment.notes && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <span className="text-sm font-medium text-gray-800">{payment.notes}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Recorded At</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(payment.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              {payment.paymentMethod === 'Cheque' && payment.status !== 'Cleared' && payment.status !== 'Completed' && (
                <button
                  onClick={() => onClearCheque(payment.id)}
                  className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <CheckCircle className="w-4 h-4" />
                  Clear Cheque
                </button>
              )}
              <button
                onClick={() => onDelete(payment.id)}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Payment
              </button>
            </div>
            <button
              onClick={() => {
                toast.success('Printing voucher...');
              }}
              className="w-full mt-2 px-4 py-2.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}