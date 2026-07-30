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
  UserCircle, PhoneCall, Mail as MailIcon
} from 'lucide-react';
import { accountsReceivableService, Customer, Summary, BankAccount, Invoice } from '../../api/account-recievables/route';
import { toast } from 'react-hot-toast';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function AccountsReceivablePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    totalOutstanding: 0,
    overdue: 0,
    dueThisWeek: 0,
    dueThisMonth: 0,
    activeCustomers: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    search: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Active', 'Overdue', 'Paid'];

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

  // ─── Fetch Customers ─────────────────────────────────────────

  const fetchCustomers = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await accountsReceivableService.getCustomers({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        filter: filter.status !== 'All' ? filter.status : undefined,
        refresh: resetPage // Force refresh on initial load
      });

      console.log('🔍 [Accounts Receivable Page] Raw response:', response);
      console.log('🔍 [Accounts Receivable Page] Customers data:', response.data);
      console.log('🔍 [Accounts Receivable Page] Summary data:', response.summary);

      // Ensure invoices is always an array
      const customersWithInvoices = (response.data || []).map(c => {
        console.log('🔍 [Accounts Receivable Page] Individual customer:', c);
        console.log('🔍 [Accounts Receivable Page] Customer outstandingAmount:', c.outstandingAmount);
        console.log('🔍 [Accounts Receivable Page] Customer totalAmount:', c.totalAmount);
        console.log('🔍 [Accounts Receivable Page] Customer paidAmount:', c.paidAmount);
        return {
          ...c,
          invoices: c.invoices || []
        };
      });

      setCustomers(customersWithInvoices);
      setPagination(response.pagination);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      toast.error(error.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await accountsReceivableService.getBankAccounts();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await accountsReceivableService.getSummary();
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
      const response = await accountsReceivableService.getCustomers({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        filter: filter.status !== 'All' ? filter.status : undefined
      });

      // Ensure invoices is always an array for new items
      const newCustomers = (response.data || []).map(c => ({
        ...c,
        invoices: c.invoices || []
      }));

      setCustomers(prev => [...prev, ...newCustomers]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more customers:', error);
      toast.error('Failed to load more customers');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchBankAccounts();
    fetchSummary();
    fetchCustomers(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchCustomers(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchCustomers(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchCustomers(true);
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchCustomers(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchCustomers(false);
  };

  // ─── Record Payment ──────────────────────────────────────────

  const handleRecordPayment = async (data: any) => {
    setSubmitting(true);
    try {
      await accountsReceivableService.recordPayment(data);
      toast.success('Payment recorded successfully!');
      setShowPaymentForm(false);
      setSelectedCustomer(null);
      fetchSummary();
      fetchCustomers(true);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Create Customer ─────────────────────────────────────────

  const handleCreateCustomer = async (data: any) => {
    setSubmitting(true);
    try {
      await accountsReceivableService.createCustomer(data);
      toast.success('Customer added successfully!');
      setShowAddCustomerForm(false);
      fetchSummary();
      fetchCustomers(true);
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Customer Detail ────────────────────────────────────

  const viewCustomerDetail = (customer: Customer) => {
    // Ensure invoices is an array
    const customerWithInvoices = {
      ...customer,
      invoices: customer.invoices || []
    };
    setSelectedCustomer(customerWithInvoices);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (customer: Customer) => {
    // Safely check invoices
    const invoices = customer?.invoices || [];
    const overdueCount = invoices.filter(inv => inv?.status === 'Overdue').length;
    if (overdueCount > 0) return 'bg-red-100 text-red-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (customer: Customer) => {
    const invoices = customer?.invoices || [];
    const overdueCount = invoices.filter(inv => inv?.status === 'Overdue').length;
    if (overdueCount > 0) return 'Overdue';
    return 'Active';
  };

  const getStatusIcon = (customer: Customer) => {
    const invoices = customer?.invoices || [];
    const overdueCount = invoices.filter(inv => inv?.status === 'Overdue').length;
    if (overdueCount > 0) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
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
      {showAddCustomerForm ? (
        <AddCustomerForm
          onCancel={() => setShowAddCustomerForm(false)}
          onSave={handleCreateCustomer}
          submitting={submitting}
        />
      ) : showPaymentForm && selectedCustomer ? (
        <PaymentForm
          customer={selectedCustomer}
          bankAccounts={bankAccounts}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedCustomer(null);
          }}
          onSave={handleRecordPayment}
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
                <Users className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
                Accounts Receivable
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} customers)
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
                onClick={() => setShowAddCustomerForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Customer</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalOutstanding)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Overdue</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(summary.overdue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Due This Week</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.dueThisWeek)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Due This Month</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(summary.dueThisMonth)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Active Customers</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{summary.activeCustomers}</p>
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
                  placeholder="Search customers..."
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

          {/* Customer List */}
          <div className="space-y-3 md:space-y-4">
            {loading && customers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Users className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No customers found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              customers.map((customer) => {
                const statusColor = getStatusColor(customer);
                const statusIcon = getStatusIcon(customer);
                const statusText = getStatusText(customer);
                const invoices = customer?.invoices || [];
                const overdueCount = invoices.filter(inv => inv?.status === 'Overdue').length;

                return (
                  <div
                    key={customer.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewCustomerDetail(customer)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-2.5 rounded-xl bg-purple-100">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{customer.name}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{statusText}</span>
                            </span>
                            {overdueCount > 0 && (
                              <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                                {overdueCount} OD
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            {customer.email && (
                              <>
                                <span className="text-[10px] md:text-xs text-gray-500">{customer.email}</span>
                                <span className="text-[10px] md:text-xs text-gray-300">•</span>
                              </>
                            )}
                            <span className="text-[10px] md:text-xs text-gray-500">{customer.phone}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{customer.totalInvoices || 0} invoices</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(customer.outstandingAmount || 0)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && customers.length > 0 && (
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

      {/* Customer Detail Modal */}
      {selectedCustomer && !showPaymentForm && !showAddCustomerForm && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onPay={() => setShowPaymentForm(true)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getStatusText={getStatusText}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD CUSTOMER FORM
// ═══════════════════════════════════════════════════════════════

function AddCustomerForm({
  onCancel,
  onSave,
  submitting
}: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    setError('');
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Customer</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Customer Name *</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="customer@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <textarea
              rows={2}
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT FORM
// ═══════════════════════════════════════════════════════════════

function PaymentForm({
  customer,
  bankAccounts,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: customer?.outstandingAmount || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    reference: '',
    bankAccountId: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const availableInvoices = customer?.invoices?.filter((inv: Invoice) => inv?.status !== 'Paid') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceId) {
      setError('Please select an invoice');
      return;
    }
    if (formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError(`Please select a bank account for ${formData.paymentMethod}`);
      return;
    }
    setError('');

    onSave({
      customerId: customer.id,
      invoiceId: formData.invoiceId,
      amount: formData.amount,
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
          <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-[#7c4dff]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Record Payment</h2>
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

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{customer?.name}</p>
          <p className="text-xs text-gray-500">
            Outstanding: <span className="font-semibold text-red-600">{formatCurrency(customer?.outstandingAmount || 0)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Select Invoice *</label>
            <select
              value={formData.invoiceId}
              onChange={(e) => {
                const invoice = customer?.invoices?.find((inv: Invoice) => inv.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  invoiceId: e.target.value,
                  amount: invoice ? (invoice.amount || 0) - (invoice.paidAmount || 0) : 0
                }));
              }}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select an invoice...</option>
              {availableInvoices.map((inv: Invoice) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {formatCurrency((inv.amount || 0) - (inv.paidAmount || 0))}
                </option>
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
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select bank account...</option>
                {bankAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} - {acc.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

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
// CUSTOMER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function CustomerDetailModal({
  customer,
  onClose,
  onPay,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getStatusText
}: any) {
  const statusColor = getStatusColor(customer);
  const statusIcon = getStatusIcon(customer);
  const statusText = getStatusText(customer);
  const invoices = customer?.invoices || [];
  const overdueCount = invoices.filter((inv: Invoice) => inv?.status === 'Overdue').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#7c4dff]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-purple-100">
              <User className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {statusText}
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                    {overdueCount} overdue
                  </span>
                )}
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{customer.totalInvoices || 0} invoices</span>
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
              <p className="text-[10px] md:text-xs text-gray-500">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(customer.outstandingAmount || 0)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Total Amount</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{formatCurrency(customer.totalAmount || 0)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Email</span>
                <span className="text-sm font-medium text-gray-800">{customer.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Phone</span>
              <span className="text-sm font-medium text-gray-800">{customer.phone}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Total Invoices</span>
              <span className="text-sm font-medium text-gray-800">{customer.totalInvoices || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Paid Amount</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(customer.paidAmount || 0)}</span>
            </div>
            {customer.lastPaymentDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Last Payment</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(customer.lastPaymentDate)}</span>
              </div>
            )}
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">Invoices</h4>
                <span className="text-xs text-gray-400">{invoices.length} invoices</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoices.map((invoice: Invoice) => {
                  const statusColors = {
                    Paid: 'green',
                    Overdue: 'red',
                    Unpaid: 'orange'
                  };
                  const color = statusColors[invoice?.status as keyof typeof statusColors] || 'gray';
                  const outstanding = (invoice?.amount || 0) - (invoice?.paidAmount || 0);

                  return (
                    <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-400">{formatDate(invoice.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600">{formatCurrency(outstanding)}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 bg-${color}-100 text-${color}-600 rounded`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {(customer.outstandingAmount || 0) > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={onPay}
                className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
              >
                <CreditCard className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}