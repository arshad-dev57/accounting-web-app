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
  Shield as Security, Wrench as Build, Monitor as Computer, Receipt as ReceiptIcon2,
  UserCircle, PhoneCall, Mail as MailIcon, FileText as FileTextIcon2,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon
} from 'lucide-react';
import { creditNotesService, CreditNote, Summary, Customer, InvoiceForCreditNote } from '../../api/credit-notes/route';
import { toast } from 'react-hot-toast';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
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
    totalCount: 0,
    totalAmount: 0,
    appliedAmount: 0,
    remainingAmount: 0,
    expiredAmount: 0,
    thisMonth: 0,
    thisWeek: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    search: ''
  });
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceForCreditNote[]>([]);

  const { symbol: currencySymbol } = useCurrency();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Issued', 'Applied', 'Expired'];

  // ─── Get Currency Symbol from Local Storage ──────────────────

  // ─── Fetch Credit Notes ──────────────────────────────────────

  const fetchCreditNotes = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await creditNotesService.getCreditNotes({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setCreditNotes(response.data || []);
      setPagination(response.pagination);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error: any) {
      console.error('Failed to fetch credit notes:', error);
      toast.error(error.message || 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, pagination.page, pagination.limit]);

  // ─── Fetch Customers ─────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await creditNotesService.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, []);

  // ─── Fetch Unpaid Invoices ───────────────────────────────────

  const fetchUnpaidInvoices = useCallback(async (customerId: string) => {
    try {
      const data = await creditNotesService.getUnpaidInvoices(customerId);
      setUnpaidInvoices(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch unpaid invoices:', error);
      setUnpaidInvoices([]);
      return [];
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await creditNotesService.getSummary();
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
      const response = await creditNotesService.getCreditNotes({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filter.status !== 'All' ? filter.status : undefined
      });

      setCreditNotes(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more credit notes:', error);
      toast.error('Failed to load more credit notes');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, filter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchCustomers();
    fetchSummary();
    fetchCreditNotes(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setFilter(prev => ({ ...prev, search: query }));
    fetchCreditNotes(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilter(prev => ({ ...prev, search: '' }));
    fetchCreditNotes(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
    fetchCreditNotes(true);
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchCreditNotes(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchCreditNotes(false);
  };

  // ─── Create Credit Note ──────────────────────────────────────

  const handleCreateCreditNote = async (data: any) => {
    setSubmitting(true);
    try {
      await creditNotesService.createCreditNote(data);
      toast.success('Credit note created successfully!');
      setShowCreateForm(false);
      fetchSummary();
      fetchCreditNotes(true);
    } catch (error: any) {
      console.error('Failed to create credit note:', error);
      toast.error(error.message || 'Failed to create credit note');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Apply Credit Note ───────────────────────────────────────

  const handleApplyCreditNote = async (data: any) => {
    setSubmitting(true);
    try {
      await creditNotesService.applyCreditNote(data);
      toast.success('Credit note applied successfully!');
      setShowApplyForm(false);
      setSelectedCreditNote(null);
      fetchSummary();
      fetchCreditNotes(true);
    } catch (error: any) {
      console.error('Failed to apply credit note:', error);
      toast.error(error.message || 'Failed to apply credit note');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Credit Note Detail ────────────────────────────────

  const viewCreditNoteDetail = (creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-green-100 text-green-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Expired': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateCreditNoteForm
          customers={customers}
          unpaidInvoices={unpaidInvoices}
          onCancel={() => {
            setShowCreateForm(false);
            setUnpaidInvoices([]);
          }}
          onSave={handleCreateCreditNote}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
          fetchUnpaidInvoices={fetchUnpaidInvoices}
        />
      ) : showApplyForm && selectedCreditNote ? (
        <ApplyCreditNoteForm
          creditNote={selectedCreditNote}
          unpaidInvoices={unpaidInvoices}
          onCancel={() => {
            setShowApplyForm(false);
            setSelectedCreditNote(null);
            setUnpaidInvoices([]);
          }}
          onSave={handleApplyCreditNote}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
          fetchUnpaidInvoices={fetchUnpaidInvoices}
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
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Credit Notes
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} notes)
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
                  setUnpaidInvoices([]);
                  setShowCreateForm(true);
                }}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-yellow-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Credit Note</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Notes</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{summary.totalCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Amount</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Applied</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(summary.appliedAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Remaining</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.remainingAmount)}</p>
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
                  placeholder="Search credit notes..."
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

          {/* Credit Note List */}
          <div className="space-y-3 md:space-y-4">
            {loading && creditNotes.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading credit notes...</p>
              </div>
            ) : creditNotes.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <FileText className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No credit notes found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              creditNotes.map((note) => {
                const statusColor = getStatusColor(note.status);
                const statusIcon = getStatusIcon(note.status);
                const expiringSoon = isExpiringSoon(note.expiryDate);

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewCreditNoteDetail(note)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-2.5 rounded-xl bg-yellow-100">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{note.creditNoteNumber}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{note.status}</span>
                            </span>
                            {expiringSoon && note.status === 'Issued' && (
                              <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            <span className="text-[10px] md:text-xs text-gray-500">{note.customerName}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">Invoice: {note.originalInvoiceNumber}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{note.reasonType}</span>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{formatDate(note.date)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-yellow-600">{formatCurrency(note.amount)}</p>
                          <p className="text-[10px] md:text-xs text-gray-400">Remaining: {formatCurrency(note.remainingAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {pagination.hasNext && creditNotes.length > 0 && (
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

      {/* Credit Note Detail Modal */}
      {selectedCreditNote && !showCreateForm && !showApplyForm && (
        <CreditNoteDetailModal
          creditNote={selectedCreditNote}
          onClose={() => setSelectedCreditNote(null)}
          onApply={() => {
            setUnpaidInvoices([]);
            setShowApplyForm(true);
          }}
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
// CREATE CREDIT NOTE FORM
// ═══════════════════════════════════════════════════════════════

function CreateCreditNoteForm({
  customers,
  unpaidInvoices,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol,
  fetchUnpaidInvoices
}: any) {
  const [formData, setFormData] = useState({
    customerId: '',
    originalInvoiceId: '',
    amount: '',
    reason: '',
    reasonType: 'Return',
    notes: '',
    expiryDays: ''
  });
  const [error, setError] = useState('');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const reasonTypes = ['Return', 'Refund', 'Discount', 'Price Adjustment', 'Damaged Goods'];

  const handleCustomerChange = async (customerId: string) => {
    setFormData(prev => ({ ...prev, customerId, originalInvoiceId: '', amount: '' }));
    setSelectedInvoice(null);
    if (customerId) {
      setIsLoadingInvoices(true);
      const invoices = await fetchUnpaidInvoices(customerId);
      setIsLoadingInvoices(false);
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = unpaidInvoices.find((inv: any) => inv.id === invoiceId);
    setSelectedInvoice(invoice);
    setFormData(prev => ({
      ...prev,
      originalInvoiceId: invoiceId,
      amount: invoice ? invoice.outstanding.toString() : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }
    if (!formData.originalInvoiceId) {
      setError('Please select an invoice');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (selectedInvoice && amount > selectedInvoice.outstanding) {
      setError('Amount cannot exceed outstanding balance');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Please enter a reason');
      return;
    }
    setError('');

    onSave({
      customerId: formData.customerId,
      originalInvoiceId: formData.originalInvoiceId,
      amount: amount,
      reason: formData.reason,
      reasonType: formData.reasonType,
      notes: formData.notes,
      expiryDays: formData.expiryDays ? parseInt(formData.expiryDays) : undefined,
      items: [{
        description: formData.reason,
        quantity: 1,
        unitPrice: amount,
        amount: amount
      }]
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <FileText className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Create Credit Note</h2>
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
          {/* Customer */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Customer *</label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select customer...</option>
              {customers.map((c: Customer) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Invoice Selection */}
          {formData.customerId && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Select Invoice *</label>
              {isLoadingInvoices ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-sm">
                  No unpaid invoices for this customer
                </div>
              ) : (
                <select
                  value={formData.originalInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  required
                >
                  <option value="">Select invoice...</option>
                  {unpaidInvoices.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {formatCurrency(inv.outstanding)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Credit Amount *</label>
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
            {selectedInvoice && (
              <p className="text-xs text-gray-500 mt-1">Max: {formatCurrency(selectedInvoice.outstanding)}</p>
            )}
          </div>

          {/* Reason Type */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reason Type *</label>
            <select
              value={formData.reasonType}
              onChange={(e) => setFormData(prev => ({ ...prev, reasonType: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              {reasonTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reason Description *</label>
            <textarea
              rows={2}
              placeholder="e.g., Customer returned 5 units, item damaged"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              required
            />
          </div>

          {/* Expiry Days */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Expiry Days</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 30"
              value={formData.expiryDays}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDays: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty for no expiry</p>
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-yellow-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-yellow-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Create Credit Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPLY CREDIT NOTE FORM
// ═══════════════════════════════════════════════════════════════

function ApplyCreditNoteForm({
  creditNote,
  unpaidInvoices,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol,
  fetchUnpaidInvoices
}: any) {
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: creditNote?.remainingAmount || 0
  });
  const [error, setError] = useState('');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  useEffect(() => {
    if (creditNote) {
      setIsLoadingInvoices(true);
      fetchUnpaidInvoices(creditNote.customerId).then(() => {
        setIsLoadingInvoices(false);
      });
    }
  }, [creditNote]);

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = unpaidInvoices.find((inv: any) => inv.id === invoiceId);
    if (invoice) {
      const maxAmount = Math.min(invoice.outstanding, creditNote.remainingAmount);
      setFormData({
        invoiceId,
        amount: maxAmount
      });
    } else {
      setFormData({ invoiceId, amount: 0 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceId) {
      setError('Please select an invoice');
      return;
    }
    const amount = parseFloat(formData.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > creditNote.remainingAmount) {
      setError(`Amount cannot exceed credit note remaining: ${formatCurrency(creditNote.remainingAmount)}`);
      return;
    }
    const invoice = unpaidInvoices.find((inv: any) => inv.id === formData.invoiceId);
    if (invoice && amount > invoice.outstanding) {
      setError(`Amount cannot exceed invoice outstanding: ${formatCurrency(invoice.outstanding)}`);
      return;
    }
    setError('');

    onSave({
      creditNoteId: creditNote.id,
      invoiceId: formData.invoiceId,
      amount: amount
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Apply Credit Note</h2>
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

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{creditNote?.creditNoteNumber}</p>
          <p className="text-xs text-gray-500">Customer: {creditNote?.customerName}</p>
          <p className="text-xs text-gray-500">
            Remaining: <span className="font-semibold text-yellow-600">{formatCurrency(creditNote?.remainingAmount || 0)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Selection */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Select Invoice *</label>
            {isLoadingInvoices ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#014582]" />
              </div>
            ) : unpaidInvoices.length === 0 ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-sm">
                No unpaid invoices for this customer
              </div>
            ) : (
              <select
                value={formData.invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              >
                <option value="">Select invoice...</option>
                {unpaidInvoices.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {formatCurrency(inv.outstanding)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Amount to Apply *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {formatCurrency(Math.min(
                creditNote?.remainingAmount || 0,
                unpaidInvoices.find((inv: any) => inv.id === formData.invoiceId)?.outstanding || 0
              ))}
            </p>
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
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Apply Credit Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREDIT NOTE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function CreditNoteDetailModal({
  creditNote,
  onClose,
  onApply,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon
}: any) {
  const statusColor = getStatusColor(creditNote.status);
  const statusIcon = getStatusIcon(creditNote.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-yellow-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-yellow-100">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{creditNote.creditNoteNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {creditNote.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(creditNote.date)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-yellow-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Credit Amount</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600">{formatCurrency(creditNote.amount)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Applied</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(creditNote.appliedAmount)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Remaining</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{formatCurrency(creditNote.remainingAmount)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Customer</span>
              <span className="text-sm font-medium text-gray-800">{creditNote.customerName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Original Invoice</span>
              <span className="text-sm font-medium text-gray-800">{creditNote.originalInvoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Invoice Amount</span>
              <span className="text-sm font-medium text-purple-600">{formatCurrency(creditNote.originalInvoiceAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Reason Type</span>
              <span className="text-sm font-medium text-gray-800">{creditNote.reasonType}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Reason</span>
              <span className="text-sm font-medium text-gray-800">{creditNote.reason}</span>
            </div>
            {creditNote.expiryDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Expiry Date</span>
                <span className={`text-sm font-medium ${new Date(creditNote.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatDate(creditNote.expiryDate)}
                  {new Date(creditNote.expiryDate) < new Date() && ' (Expired)'}
                </span>
              </div>
            )}
            {creditNote.notes && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Notes</span>
                <span className="text-sm font-medium text-gray-800">{creditNote.notes}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Created At</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(creditNote.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          {creditNote.status === 'Issued' && creditNote.remainingAmount > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={onApply}
                className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
              >
                <CheckCircle className="w-4 h-4" />
                Apply Credit Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}