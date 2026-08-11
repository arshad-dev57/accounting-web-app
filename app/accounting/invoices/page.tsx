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
  CreditCard as CreditCardIcon,
  TrendingUp,
  PlusCircle as PlusCircleIcon, MinusCircle as MinusCircleIcon
} from 'lucide-react';
import { invoicesService, Invoice, InvoiceItem, Customer, BankAccount } from '../../api/invoices/route';
import { toast } from 'react-hot-toast';

const PAGE_LIMIT = 10;

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  customerId: string;
}

interface InvoiceFormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    customerId: ''
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef(0);

  const statusOptions = ['All', 'Unpaid', 'Paid', 'Overdue', 'Partial'];

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

  // ─── Fetch Invoices ──────────────────────────────────────────

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);

    invoicesService.getInvoices({
      page: currentPage,
      limit: PAGE_LIMIT,
      search: debouncedSearch.trim() || undefined,
      status: filter.status !== 'All' ? filter.status : undefined,
      customerId: filter.customerId || undefined,
    }).then((response) => {
      if (requestId !== latestRequestRef.current) return;
      const pages = Math.max(1, response.pagination?.pages ?? 1);
      const page = response.pagination?.page ?? currentPage;
      setInvoices(response.data || []);
      setPagination({
        page,
        limit: PAGE_LIMIT,
        total: response.pagination?.total ?? 0,
        pages,
        hasNext: response.pagination?.hasNext ?? page < pages,
        hasPrev: response.pagination?.hasPrev ?? page > 1,
      });
      if (response.summary) setSummary(response.summary);
      if (page !== currentPage) setCurrentPage(page);
    }).catch((error: any) => {
      if (requestId !== latestRequestRef.current) return;
      console.error('Failed to fetch invoices:', error);
      toast.error(error.message || 'Failed to load invoices');
    }).finally(() => {
      if (requestId === latestRequestRef.current) setLoading(false);
    });
  }, [debouncedSearch, filter.status, filter.customerId, currentPage, refreshTick]);

  // ─── Fetch Customers ─────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await invoicesService.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, []);

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await invoicesService.getBankAccounts();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchBankAccounts();
  }, [fetchCustomers, fetchBankAccounts]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(query);
      setCurrentPage(1);
    }, 300);
  };

  const clearSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    setCurrentPage(1);
  };

  const handleCustomerFilter = (customerId: string) => {
    setFilter(prev => ({ ...prev, customerId }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setRefreshTick(t => t + 1);
  };

  const handlePageChange = (newPage: number) => {
    if (
      loading ||
      newPage < 1 ||
      newPage > pagination.pages ||
      newPage === currentPage
    ) {
      return;
    }
    setCurrentPage(newPage);
  };

  // ─── Create Invoice ──────────────────────────────────────────

  const handleCreateInvoice = async (data: any) => {
    setSubmitting(true);
    try {
      await invoicesService.createInvoice(data);
      toast.success('Invoice created successfully!');
      setShowCreateForm(false);
      setCurrentPage(1);
      setRefreshTick(t => t + 1);
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Record Payment ──────────────────────────────────────────

  const handleRecordPayment = async (data: any) => {
    setSubmitting(true);
    try {
      await invoicesService.recordPayment(data);
      toast.success('Payment recorded successfully!');
      setSelectedInvoice(null);
      setCurrentPage(1);
      setRefreshTick(t => t + 1);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Invoice ──────────────────────────────────────────

  const handleDeleteInvoice = async (id: string, number: string) => {
    if (!confirm(`Delete invoice ${number}?`)) return;
    try {
      await invoicesService.deleteInvoice(id);
      toast.success('Invoice deleted successfully!');
      setSelectedInvoice(null);
      setCurrentPage(1);
      setRefreshTick(t => t + 1);
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  // ─── View Invoice Detail ─────────────────────────────────────

  const viewInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (status === 'Paid') return 'bg-green-100 text-green-700';
    if (isOverdue || status === 'Overdue') return 'bg-red-100 text-red-700';
    if (status === 'Partial') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (status === 'Paid') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (isOverdue || status === 'Overdue') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (status === 'Partial') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-blue-600" />;
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateInvoiceForm
          customers={customers}
          onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateInvoice}
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
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Invoices
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} invoices)
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
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Amount</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Amount Paid</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalPaid)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalOutstanding)}</p>
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
                  placeholder="Search invoices..."
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

                <div className="relative flex-1 sm:flex-none min-w-[120px]">
                  <select
                    value={filter.customerId}
                    onChange={(e) => handleCustomerFilter(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="">All Customers</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice List */}
          <div className="space-y-3 md:space-y-4">
            {loading && invoices.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Receipt className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No invoices found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              invoices.map((invoice) => {
                const overdue = isOverdue(invoice.dueDate) && invoice.status !== 'Paid';
                const statusColor = getStatusColor(invoice.status, overdue);
                const statusIcon = getStatusIcon(invoice.status, overdue);

                return (
                  <div
                    key={invoice.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewInvoiceDetail(invoice)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-2.5 rounded-xl bg-purple-100">
                          <Receipt className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{invoice.invoiceNumber}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{invoice.status}</span>
                            </span>
                            {overdue && (
                              <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{invoice.customerName}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">Due: {formatDate(invoice.dueDate)}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{invoice.items?.length || 0} items</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(invoice.outstanding)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {pagination.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs md:text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">
                    {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  –{' '}
                  <span className="font-semibold text-gray-700">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-700">{pagination.total}</span> invoices
                </p>

                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1 || loading}
                    className="hidden sm:flex p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="First page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                      let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);

                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-xs md:text-sm font-medium transition-all"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="start-ellipsis" className="px-2 text-gray-400">...</span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-xs md:text-sm font-medium transition-all ${
                              i === pagination.page
                                ? 'bg-[#014582] text-white border-[#014582] shadow-md shadow-[#014582]/25'
                                : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < pagination.pages) {
                        if (endPage < pagination.pages - 1) {
                          pages.push(
                            <span key="end-ellipsis" className="px-2 text-gray-400">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={pagination.pages}
                            onClick={() => handlePageChange(pagination.pages)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-xs md:text-sm font-medium transition-all"
                          >
                            {pagination.pages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages || loading}
                    className="hidden sm:flex p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Last page"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-gray-500">Go to</span>
                  <input
                    type="number"
                    min={1}
                    max={pagination.pages}
                    value={pagination.page}
                    onChange={(e) => {
                      const page = parseInt(e.target.value, 10);
                      if (page >= 1 && page <= pagination.pages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-12 md:w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm text-center focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                  <span className="text-xs md:text-sm text-gray-500">of {pagination.pages}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && !showCreateForm && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          bankAccounts={bankAccounts}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={handleRecordPayment}
          onDelete={handleDeleteInvoice}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          isOverdue={isOverdue}
          submitting={submitting}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE INVOICE FORM
// ═══════════════════════════════════════════════════════════════

function CreateInvoiceForm({
  customers,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: 0,
    notes: ''
  });
  const [items, setItems] = useState<InvoiceFormItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
  ]);
  const [error, setError] = useState('');

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    items.forEach(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      taxTotal += amount * (item.taxRate / 100);
    });
    const total = subtotal + taxTotal - formData.discount;
    return { subtotal, taxTotal, total };
  };

  const { subtotal, taxTotal, total } = calculateTotals();

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceFormItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }
    const validItems = items.filter(item => item.description.trim() && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }
    setError('');

    onSave({
      customerId: formData.customerId,
      date: new Date(formData.date),
      dueDate: new Date(formData.dueDate),
      discount: formData.discount,
      notes: formData.notes,
      items: validItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate
      }))
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Receipt className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Create Invoice</h2>
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
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Customer *</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select customer...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          {/* Items */}
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
                    <div className="grid grid-cols-3 gap-2">
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
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Tax"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                        />
                      </div>
                    </div>
                    {item.quantity * item.unitPrice > 0 && (
                      <p className="text-xs font-semibold text-purple-600 text-right">
                        Amount: {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-[#014582] font-semibold hover:text-purple-700"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Discount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">-{formatCurrency(formData.discount)}</span>
                </div>
              )}
              <div className="border-t border-purple-200 pt-1 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-purple-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Payment terms, special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
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
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INVOICE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function InvoiceDetailModal({
  invoice,
  bankAccounts,
  onClose,
  onRecordPayment,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  isOverdue,
  submitting,
  currencySymbol
}: any) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: invoice?.outstanding || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    reference: '',
    bankAccountId: '',
    notes: ''
  });

  // Load company profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = document.cookie.split('auth_token=')[1]?.split(';')[0];
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCompanyProfile(data.data);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, []);

  const overdue = isOverdue(invoice.dueDate) && invoice.status !== 'Paid';
  const statusColor = getStatusColor(invoice.status, overdue);
  const statusIcon = getStatusIcon(invoice.status, overdue);

  // Download invoice as PDF (uses PDF report settings branding)
  const handleDownloadPDF = async () => {
    const { createBrandedReport, getBrandingAccentRgb } = await import('../../../lib/pdf-branding');
    const autoTable = (await import('jspdf-autotable')).default;

    const {
      doc,
      branding,
      margin,
      pageWidth,
      startY,
      accentHex,
      finalize,
    } = await createBrandedReport({
      reportTitle: `Invoice ${invoice.invoiceNumber}`,
    });

    const accent = getBrandingAccentRgb(branding);
    let yPos = startY;

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Customer: ${invoice.customerName}`, margin, yPos);
    yPos += 5;
    doc.text(`Date: ${formatDate(invoice.date)}`, margin, yPos);
    yPos += 5;
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, margin, yPos);
    yPos += 8;

    const itemRows = (invoice.items || []).map((item: InvoiceItem, i: number) => [
      `${i + 1}`,
      item.description || '',
      String(item.quantity),
      formatCurrency(item.amount),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Description', 'Qty', 'Amount']],
      body: itemRows.length ? itemRows : [['—', 'No items', '—', '—']],
      theme: 'striped',
      headStyles: { fillColor: accentHex, textColor: '#ffffff' },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, margin, yPos);
    yPos += 6;
    if (invoice.taxTotal > 0) {
      doc.text(`Tax: ${formatCurrency(invoice.taxTotal)}`, margin, yPos);
      yPos += 6;
    }
    if (invoice.discount > 0) {
      doc.text(`Discount: -${formatCurrency(invoice.discount)}`, margin, yPos);
      yPos += 6;
    }
    doc.setFontSize(13);
    doc.text(`TOTAL: ${formatCurrency(invoice.totalAmount)}`, margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid: ${formatCurrency(invoice.paidAmount)}`, margin, yPos);
    yPos += 5;
    doc.text(`Outstanding: ${formatCurrency(invoice.outstanding)}`, margin, yPos);

    finalize({
      signatureY: yPos + 4,
      filename: `invoice_${invoice.invoiceNumber}.pdf`,
    });
  };

  // Send invoice via email
  const handleSendEmail = async () => {
    if (!emailInput) {
      toast.error('Please enter an email address');
      return;
    }
    setSendingEmail(true);
    try {
      const token = document.cookie.split('auth_token=')[1]?.split(';')[0];
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
          invoice,
          companyProfile,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Invoice sent successfully');
        setShowEmailForm(false);
        setEmailInput('');
      } else {
        toast.error('Failed to send invoice: ' + data.message);
      }
    } catch (e) {
      toast.error('Failed to send invoice');
    } finally {
      setSendingEmail(false);
    }
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentData.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > invoice.outstanding) {
      toast.error(`Amount cannot exceed outstanding: ${formatCurrency(invoice.outstanding)}`);
      return;
    }
    if (paymentData.paymentMethod !== 'Cash' && !paymentData.bankAccountId) {
      toast.error(`Please select a bank account for ${paymentData.paymentMethod}`);
      return;
    }

    onRecordPayment({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: amount,
      paymentDate: new Date(paymentData.paymentDate),
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      bankAccountId: paymentData.paymentMethod !== 'Cash' ? paymentData.bankAccountId : null,
      notes: paymentData.notes
    });
    setShowPaymentForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-purple-100">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {invoice.status}
                </span>
                {overdue && (
                  <span className="text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(invoice.date)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {showPaymentForm ? (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Record Payment</h3>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.outstanding}
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max: {formatCurrency(invoice.outstanding)}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value, bankAccountId: '' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                {paymentData.paymentMethod !== 'Cash' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account</label>
                    <select
                      value={paymentData.bankAccountId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Select bank account...</option>
                      {bankAccounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.name} - {acc.accountNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    placeholder="Reference number"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Additional notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500">Total</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(invoice.totalAmount)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500">Paid</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500">Outstanding</p>
                  <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(invoice.outstanding)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Customer</span>
                  <span className="text-sm font-medium text-gray-800">{invoice.customerName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Date</span>
                  <span className="text-sm font-medium text-gray-800">{formatDate(invoice.date)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Due Date</span>
                  <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(invoice.dueDate)}
                    {overdue && ' (Overdue)'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Subtotal</span>
                  <span className="text-sm font-medium text-gray-800">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxTotal > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">Tax</span>
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(invoice.taxTotal)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">Discount</span>
                    <span className="text-sm font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                {invoice.notes && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 font-medium">Notes</span>
                    <span className="text-sm font-medium text-gray-800">{invoice.notes}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              {invoice.items && invoice.items.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Items</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoice.items.map((item: InvoiceItem, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.description}</p>
                          <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <p className="text-sm font-bold text-purple-600">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex flex-col gap-2">
                  {/* Primary Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {invoice.status !== 'Paid' && (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                      >
                        <CreditCard className="w-4 h-4" />
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#014582]/25"
                    >
                      <Mail className="w-4 h-4" />
                      Send Email
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>

                  {/* Email Form */}
                  {showEmailForm && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="customer@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="w-full py-2 rounded-lg bg-purple-500 text-white font-semibold text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {sendingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Invoice'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(invoice.id, invoice.invoiceNumber)}
                    className="w-full px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Invoice
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}