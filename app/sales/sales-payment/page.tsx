'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, CreditCard, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, Save, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, Banknote, FileText,
  RefreshCw, Trash2, Building2, CalendarDays,
  Receipt, Wallet, ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown
} from 'lucide-react';
import { salesPaymentService, SalesPayment, InvoiceForPayment, PaymentStats, Customer, BankAccount } from '../../api/salespayment/route';
import { useLocation } from '@/lib/location-context';

// ─── MAIN PAGE ──────────────────────────────────────────────────
export function SalesPaymentsPage() {
  const { selectedLocationId } = useLocation();
  const [payments, setPayments] = useState<SalesPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SalesPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<PaymentStats>({
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<SalesPayment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentToActOn, setPaymentToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Create Form State ──────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceForPayment[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceForPayment[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'];
  const filters = ['all', 'Completed', 'Pending', 'Failed', 'Cancelled'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Payments ──────────────────────────────────────────
  const fetchPayments = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await salesPaymentService.getPayments({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setPayments(response.data || []);
      setFilteredPayments(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      alert(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFilter, fromDate, toDate, pagination.page, pagination.limit, selectedLocationId]);

  // ─── Load More ──────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await salesPaymentService.getPayments({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setPayments(prev => [...prev, ...(response.data || [])]);
      setFilteredPayments(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more payments:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, selectedFilter, fromDate, toDate, selectedLocationId]);

  // ─── Apply Local Filters ────────────────────────────────────
  useEffect(() => {
    const filtered = payments.filter(item => {
      // Status filter
      if (selectedFilter !== 'all' && item.status !== selectedFilter) {
        return false;
      }
      // Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.paymentNumber.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          (item.reference && item.reference.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
    setFilteredPayments(filtered);
  }, [payments, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────
  useEffect(() => {
    fetchPayments(true);
  }, []);

  useEffect(() => {
    fetchPayments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // ─── Search ──────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchPayments(true);
  };

  // ─── Clear Search ──────────────────────────────────────────
  const clearSearch = () => {
    setSearchTerm('');
    fetchPayments(true);
  };

  // ─── Filter Change ──────────────────────────────────────────
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    fetchPayments(true);
  };

  // ─── Date Filter ────────────────────────────────────────────
  const handleDateFilter = () => {
    fetchPayments(true);
  };

  // ─── Refresh ────────────────────────────────────────────────
  const handleRefresh = () => {
    fetchPayments(true);
  };

  // ─── Page Change ────────────────────────────────────────────
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchPayments(false);
  };

  // ─── Create Form ────────────────────────────────────────────
  const openCreateForm = () => {
    resetCreateForm();
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setAvailableInvoices([]);
    setSelectedInvoices([]);
    setPaymentMethod('Cash');
    setSelectedBankAccount(null);
    setPaymentAmount('');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsSearchingCustomers(false);
    setIsLoadingInvoices(false);
  };

  // ─── Search Customers ──────────────────────────────────────
  const searchCustomers = async (query: string) => {
    setCustomerSearchQuery(query);
    if (query.trim().length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const results = await salesPaymentService.searchCustomers(query);
      setCustomerSearchResults(results);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // ─── Select Customer ────────────────────────────────────────
  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchResults([]);
    setCustomerSearchQuery(customer.name || '');
    setIsLoadingInvoices(true);
    try {
      const invoices = await salesPaymentService.getCustomerInvoices(
        customer.id || customer._id || '',
        selectedLocationId || undefined
      );
      setAvailableInvoices(invoices);
      // Auto-select all invoices
      const selected = invoices.map((inv: InvoiceForPayment) => ({
        ...inv,
        isSelected: true,
        amountToPay: inv.outstanding
      }));
      setSelectedInvoices(selected);
      const total = selected.reduce((sum: number, inv: InvoiceForPayment) => sum + inv.amountToPay, 0);
      setPaymentAmount(total.toFixed(2));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setAvailableInvoices([]);
      setSelectedInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // ─── Toggle Invoice Selection ──────────────────────────────
  const toggleInvoiceSelection = (invoice: InvoiceForPayment) => {
    const existing = selectedInvoices.find(inv => inv.id === invoice.id);
    let updated: InvoiceForPayment[];
    if (existing) {
      updated = selectedInvoices.filter(inv => inv.id !== invoice.id);
    } else {
      updated = [...selectedInvoices, { ...invoice, isSelected: true, amountToPay: invoice.outstanding }];
    }
    setSelectedInvoices(updated);
    const total = updated.reduce((sum, inv) => sum + inv.amountToPay, 0);
    setPaymentAmount(total.toFixed(2));
  };

  // ─── Update Invoice Amount ──────────────────────────────────
  const updateInvoiceAmount = (invoiceId: string, amount: number) => {
    const updated = selectedInvoices.map(inv => {
      if (inv.id === invoiceId) {
        const maxAmount = Math.min(amount, inv.outstanding);
        return { ...inv, amountToPay: Math.max(0, maxAmount) };
      }
      return inv;
    });
    setSelectedInvoices(updated);
    const total = updated.reduce((sum, inv) => sum + inv.amountToPay, 0);
    setPaymentAmount(total.toFixed(2));
  };

  // ─── Fetch Bank Accounts ────────────────────────────────────
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const accounts = await salesPaymentService.getBankAccounts();
        setBankAccounts(accounts);
      } catch (error) {
        console.error('Failed to fetch bank accounts:', error);
      }
    };
    fetchBankAccounts();
  }, []);

  // ─── Submit Payment ─────────────────────────────────────────
  const handleReceivePayment = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice');
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }
    if ((paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') && !selectedBankAccount) {
      alert('Please select a bank account');
      return;
    }
    if (!paymentDate) {
      alert('Please select a payment date');
      return;
    }

    setSubmitting(true);
    try {
      const invoicePayments = selectedInvoices.map(inv => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amountPaid: inv.amountToPay
      }));

      await salesPaymentService.receivePayment({
        customerId: selectedCustomer.id || selectedCustomer._id || '',
        customerName: selectedCustomer.name || '',
        amount: amount,
        paymentMethod,
        ...(paymentMethod !== 'Cash' && selectedBankAccount?.id
          ? {
              bankAccountId: selectedBankAccount.id,
              bankAccountName: selectedBankAccount.accountName || '',
            }
          : {}),
        reference: paymentReference,
        notes: paymentNotes,
        paymentDate,
        invoicePayments
      });

      closeCreateForm();
      fetchPayments(true);
    } catch (error: any) {
      console.error('Failed to receive payment:', error);
      alert(error.message || 'Failed to receive payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Cancel Payment ─────────────────────────────────────────
  const handleCancelPayment = async () => {
    if (!paymentToActOn) return;
    setSubmitting(true);
    try {
      await salesPaymentService.cancelPayment(paymentToActOn, cancelReason || 'Cancelled by user');
      setShowCancelConfirm(false);
      setPaymentToActOn(null);
      setCancelReason('');
      fetchPayments(true);
    } catch (error: any) {
      console.error('Failed to cancel payment:', error);
      alert(error.message || 'Failed to cancel payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Payment ─────────────────────────────────────────
  const handleDeletePayment = async () => {
    if (!paymentToActOn) return;
    setSubmitting(true);
    try {
      await salesPaymentService.deletePayment(paymentToActOn);
      setShowDeleteConfirm(false);
      setPaymentToActOn(null);
      setViewingPayment(null);
      fetchPayments(true);
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      alert(error.message || 'Failed to delete payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Payment Detail ────────────────────────────────────
  const viewPaymentDetail = (payment: SalesPayment) => {
    setViewingPayment(payment);
  };

  // ─── Get Status Color ──────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Cancelled': return <Ban className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rs. 0.00';
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {showCreateForm ? (
        <CreatePaymentForm
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customerSearchQuery={customerSearchQuery}
          setCustomerSearchQuery={setCustomerSearchQuery}
          customerSearchResults={customerSearchResults}
          isSearchingCustomers={isSearchingCustomers}
          availableInvoices={availableInvoices}
          setAvailableInvoices={setAvailableInvoices}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
          isLoadingInvoices={isLoadingInvoices}
          paymentMethod={paymentMethod}
          selectedBankAccount={selectedBankAccount}
          bankAccounts={bankAccounts}
          paymentDate={paymentDate}
          paymentAmount={paymentAmount}
          paymentReference={paymentReference}
          paymentNotes={paymentNotes}
          paymentMethods={paymentMethods}
          setPaymentDate={setPaymentDate}
          setPaymentAmount={setPaymentAmount}
          setPaymentReference={setPaymentReference}
          setPaymentNotes={setPaymentNotes}
          setPaymentMethod={setPaymentMethod}
          setSelectedBankAccount={setSelectedBankAccount}
          searchCustomers={searchCustomers}
          selectCustomer={selectCustomer}
          toggleInvoiceSelection={toggleInvoiceSelection}
          updateInvoiceAmount={updateInvoiceAmount}
          handleReceivePayment={handleReceivePayment}
          closeCreateForm={closeCreateForm}
          submitting={submitting}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/warehouse/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#014582]" />
                Sales Payments
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({pagination.total} payments)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                Receive Payment
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Today's Payments</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{stats.todayCount}</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(stats.todayAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">This Month</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{stats.monthCount}</p>
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(stats.monthAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Total Records</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{pagination.total}</p>
              <p className="text-sm font-semibold text-purple-600">{pagination.pages} pages</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Current Page</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{pagination.page}</p>
              <p className="text-sm font-semibold text-orange-600">
                {pagination.hasNext ? 'More available' : 'Last page'}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {filters.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  placeholder="From"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  placeholder="To"
                />
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-[#014582]/10 text-[#014582] rounded-lg text-sm font-semibold hover:bg-[#014582]/20 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoices</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-gray-500">Loading payments...</p>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No payments found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-[#014582]">{payment.paymentNumber}</p>
                            <p className="text-xs text-gray-400">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-gray-800">{payment.customerName}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-gray-800">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {payment.totalInvoices || 0}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewPaymentDetail(payment)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {payment.canCancel && (
                              <button
                                onClick={() => {
                                  setPaymentToActOn(payment.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {payment.canDelete && (
                              <button
                                onClick={() => {
                                  setPaymentToActOn(payment.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {pagination.hasNext && filteredPayments.length > 0 && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-semibold text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all disabled:opacity-50"
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
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Detail Modal */}
      {viewingPayment && (
        <PaymentDetailModal
          payment={viewingPayment}
          onClose={() => setViewingPayment(null)}
          onCancel={(id: string) => {
            setViewingPayment(null);
            setPaymentToActOn(id);
            setShowCancelConfirm(true);
          }}
          onDelete={(id: string) => {
            setViewingPayment(null);
            setPaymentToActOn(id);
            setShowDeleteConfirm(true);
          }}
          onRefresh={handleRefresh}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          submitting={submitting}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <ConfirmationModal
          title="Cancel Payment"
          message="Are you sure you want to cancel this payment? This action cannot be undone."
          confirmLabel="Cancel Payment"
          confirmColor="bg-orange-500 hover:bg-orange-600"
          onConfirm={handleCancelPayment}
          onCancel={() => {
            setShowCancelConfirm(false);
            setPaymentToActOn(null);
            setCancelReason('');
          }}
          loading={submitting}
          extraContent={
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (Optional)</label>
              <input
                type="text"
                placeholder="Enter reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
              />
            </div>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Payment"
          message="Are you sure you want to delete this payment? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeletePayment}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPaymentToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE PAYMENT FORM
// ═══════════════════════════════════════════════════════════════

function CreatePaymentForm({
  selectedCustomer,
  setSelectedCustomer,
  customerSearchQuery,
  setCustomerSearchQuery,
  customerSearchResults,
  isSearchingCustomers,
  availableInvoices,
  setAvailableInvoices,
  selectedInvoices,
  setSelectedInvoices,
  isLoadingInvoices,
  paymentMethod,
  selectedBankAccount,
  bankAccounts,
  paymentDate,
  paymentAmount,
  paymentReference,
  paymentNotes,
  paymentMethods,
  setPaymentDate,
  setPaymentAmount,
  setPaymentReference,
  setPaymentNotes,
  setPaymentMethod,
  setSelectedBankAccount,
  searchCustomers,
  selectCustomer,
  toggleInvoiceSelection,
  updateInvoiceAmount,
  handleReceivePayment,
  closeCreateForm,
  submitting,
  formatCurrency,
  formatDate
}: any) {
  const selectedTotal = selectedInvoices.reduce((sum: number, inv: any) => sum + inv.amountToPay, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateForm} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#014582]" />
            Receive Payment
          </h2>
        </div>
        <button
          onClick={closeCreateForm}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Invoices */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Select Customer</h3>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone..."
                  value={customerSearchQuery}
                  onChange={(e) => searchCustomers(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {isSearchingCustomers && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
                  <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                </div>
              )}

              {customerSearchResults.length > 0 && !isSearchingCustomers && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {customerSearchResults.map((customer: Customer) => (
                    <button
                      key={customer.id || customer._id}
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <p className="font-medium text-gray-800">{customer.name}</p>
                      <p className="text-sm text-gray-400">
                        {customer.email} {customer.phone && `• ${customer.phone}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedCustomer.email} {selectedCustomer.phone && `• ${selectedCustomer.phone}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchQuery('');
                      setAvailableInvoices([]);
                      setSelectedInvoices([]);
                      setPaymentAmount('');
                    }}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Selection */}
          {selectedCustomer && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">Select Invoices</h3>
                <span className="text-sm text-gray-400">
                  {selectedInvoices.length} selected
                </span>
              </div>

              {isLoadingInvoices ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                  <p className="mt-2 text-sm text-gray-400">Loading invoices...</p>
                </div>
              ) : availableInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No unpaid invoices found for this customer</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableInvoices.map((invoice: InvoiceForPayment) => {
                    const isSelected = selectedInvoices.some((inv: any) => inv.id === invoice.id);
                    const isOverdue = new Date(invoice.dueDate) < new Date();
                    return (
                      <div
                        key={invoice.id}
                        className={`p-3 border rounded-lg transition-all ${
                          isSelected
                            ? 'border-[#014582] bg-[#014582]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleInvoiceSelection(invoice)}
                            className="mt-1 w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-[#014582]">{invoice.invoiceNumber}</p>
                                <p className="text-xs text-gray-400">
                                  Due: {formatDate(invoice.dueDate)}
                                  {isOverdue && (
                                    <span className="ml-2 text-red-500 font-semibold">OVERDUE</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-800">{formatCurrency(invoice.outstanding)}</p>
                                {isOverdue && (
                                  <span className="text-xs text-red-500 font-semibold">OVERDUE</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500">Amount to Pay</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={invoice.outstanding}
                                    value={invoice.amountToPay}
                                    onChange={(e) => updateInvoiceAmount(invoice.id, parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                                  />
                                </div>
                                <button
                                  onClick={() => updateInvoiceAmount(invoice.id, invoice.outstanding)}
                                  className="px-3 py-1.5 text-xs font-semibold text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all"
                                >
                                  Full
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Details</h3>

            <div className="space-y-3">
              {/* Payment Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPaymentMethod(next);
                    if (next === 'Cash') setSelectedBankAccount(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {paymentMethods.map((method: string) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Bank Account (for Bank Transfer) */}
              {paymentMethod !== 'Cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Account *</label>
                  <select
                    value={selectedBankAccount?.id || ''}
                    onChange={(e) => {
                      const account = bankAccounts.find((acc: any) => acc.id === e.target.value);
                      setSelectedBankAccount(account || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} - {account.bankName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedInvoices.length > 0 && (
            <div className="bg-[#014582]/5 border border-[#014582]/20 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium text-gray-800">{selectedCustomer?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoices</span>
                  <span className="font-medium text-gray-800">{selectedInvoices.length} invoices</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-800">{paymentMethod}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-base">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="font-bold text-[#014582]">{formatCurrency(selectedTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={closeCreateForm}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleReceivePayment}
              disabled={!selectedCustomer || selectedInvoices.length === 0 || submitting}
              className="flex-1 px-4 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Receive Payment
            </button>
          </div>
        </div>
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
  onCancel,
  onDelete,
  onRefresh,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  submitting
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{payment.paymentNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  {payment.status}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{payment.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Amount</p>
              <p className="text-lg font-bold text-[#014582] mt-1">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Payment Method</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{payment.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Date</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{formatDate(payment.paymentDate)}</p>
            </div>
          </div>

          {payment.bankAccountName && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Bank Account</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{payment.bankAccountName}</p>
            </div>
          )}

          {payment.reference && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Reference</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{payment.reference}</p>
            </div>
          )}

          {payment.notes && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Invoices Paid</h4>
              <span className="text-xs text-gray-400">{payment.totalInvoices} invoices</span>
            </div>
            <div className="space-y-2">
              {payment.invoicePayments?.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-[#014582]">{inv.invoiceNumber}</p>
                    {inv.invoice && (
                      <p className="text-xs text-gray-400">Total: {formatCurrency(inv.invoice.grandTotal)}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(inv.amountPaid)}</p>
                </div>
              ))}
            </div>
          </div>

          {payment.journalEntry && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-bold text-gray-700">Journal Entry: {payment.journalEntry.entryNumber}</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {payment.journalEntry.lines?.map((line: any) => (
                  <div key={line.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{line.accountName}</span>
                    {line.debit > 0 && (
                      <span className="text-green-600 font-semibold">Dr {formatCurrency(line.debit)}</span>
                    )}
                    {line.credit > 0 && (
                      <span className="text-red-600 font-semibold">Cr {formatCurrency(line.credit)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(payment.canCancel || payment.canDelete) && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              {payment.canCancel && (
                <button
                  onClick={() => onCancel(payment.id)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  Cancel Payment
                </button>
              )}
              {payment.canDelete && (
                <button
                  onClick={() => onDelete(payment.id)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm">{message}</p>
          {extraContent}
          <div className="flex gap-3 mt-6">
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

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}