'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, FileText, Clock, 
  CheckCircle, Loader2, X, ChevronDown, Eye, Trash2, MapPin, Ban, ShoppingCart, Edit3, Send, Download,
  ArrowLeft, CheckSquare, Square, Users, Package, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Quotation, Customer, Product, QuotationLineDraft } from '@/lib/types/quotation';
import { useLocationOptional } from '@/lib/location-context';
import PDFService from '@/lib/pdf-service';
import TaxRateSelect from '@/components/TaxRateSelect';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200',
  'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  Sent: 'bg-blue-100 text-blue-700 border-blue-200',
  Accepted: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Expired: 'bg-gray-100 text-gray-700 border-gray-200',
  'Partially Converted': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Converted: 'bg-purple-100 text-purple-700 border-purple-200',
  Cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
};

const pill = (map: Record<string, string>, val: string) =>
  `text-xs font-semibold px-3 py-1 rounded-full border ${map[val] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`;

const STATUS_OPTIONS = ['all', 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Partially Converted', 'Converted', 'Cancelled'];

export function QuotationsPage() {
  const { selectedLocationId, selectedLocation } = useLocationOptional();
  
  // Navigation View Modes: 'list' | 'create' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // List View State
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Quotations List
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/quotations?${params.toString()}`, { headers });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        console.error('Failed to fetch quotations:', result.message || response.status);
        setQuotations([]);
        return;
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : [];

      setQuotations(rows);

      const pagination = result.pagination || result.data?.pagination;
      if (pagination) {
        setTotalRecords(pagination.total || 0);
        setTotalPages(pagination.pages || 1);
        setHasNext(Boolean(pagination.hasNext));
        setHasPrev(Boolean(pagination.hasPrev));
      } else {
        setTotalRecords(rows.length);
      }
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, selectedLocationId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocationId]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchQuotations();
    }
  }, [viewMode, fetchQuotations]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Single Quotation detail fetch for page view
  const fetchQuotationDetail = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/quotations/${id}`, { headers });
      const result = await response.json();

      if (result.success && result.data) {
        setSelectedQuotation(result.data);
      }
    } catch (error) {
      console.error('Error fetching quotation detail:', error);
    }
  };

  const handleQuotationClick = async (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewMode('detail');
    await fetchQuotationDetail(quotation.id);
  };

  // Status Action Handlers
  const handleUpdateStatus = async (quotationId: string, newStatus: string, successMessage: string) => {
    setActionLoading(`status-${quotationId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/quotations/${quotationId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        showToast('success', successMessage);
        if (selectedQuotation?.id === quotationId) {
          setSelectedQuotation({ ...selectedQuotation, status: newStatus });
          await fetchQuotationDetail(quotationId);
        }
        fetchQuotations();
      } else {
        showToast('error', result.message || 'Failed to update quotation status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('error', 'Failed to update quotation status');
    } finally {
      setActionLoading(null);
    }
  };

  // Convert Quotation to Sales Order (full remaining qty; supports re-convert when Partially Converted)
  const handleConvertQuotation = async (quotationId: string) => {
    const isPartial = selectedQuotation?.id === quotationId && selectedQuotation?.status === 'Partially Converted';
    const msg = isPartial
      ? 'Convert the remaining quotation lines into another Sales Order?'
      : 'Convert this quotation into an Official Sales Order now? (You can convert partially later by converting remaining lines.)';
    if (!confirm(msg)) return;
    setActionLoading(`convert-${quotationId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Optional: convert only remaining lines explicitly when backend has remainingLines
      // Empty body = convert all remaining quantities
      const response = await fetch(`/api/quotations/${quotationId}/convert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result.success) {
        const orderNumber = result.data?.order?.orderNumber || 'New Sales Order';
        const status = result.data?.quotation?.status || 'Converted';
        const remaining = result.data?.remainingLines?.length || 0;
        showToast(
          'success',
          status === 'Partially Converted'
            ? `Sales Order (${orderNumber}) created. ${remaining} line(s) still remaining on quotation.`
            : `Sales Order (${orderNumber}) created successfully from quotation!`
        );
        if (selectedQuotation?.id === quotationId) {
          setSelectedQuotation({ ...selectedQuotation, status: status as any });
          await fetchQuotationDetail(quotationId);
        }
        fetchQuotations();
      } else {
        showToast('error', result.message || 'Failed to convert quotation to order');
      }
    } catch (error) {
      console.error('Failed to convert quotation:', error);
      showToast('error', 'Failed to convert quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) return;
    setActionLoading(`delete-${quotationId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (result.success) {
        showToast('success', 'Quotation deleted successfully');
        setViewMode('list');
        fetchQuotations();
      } else {
        showToast('error', result.message || 'Failed to delete quotation');
      }
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      showToast('error', 'Failed to delete quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPDF = async (quotation: Quotation) => {
    setActionLoading(`pdf-${quotation.id}`);
    try {
      let data: Quotation = quotation;
      if (!data.items?.length) {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`/api/quotations/${quotation.id}`, { headers });
        const result = await response.json();
        if (result?.success && result.data) data = result.data;
      }
      await PDFService.downloadQuotationPDF(data, undefined, `Quotation_${data.quotationNumber}.pdf`);
    } catch (error: any) {
      console.error('Failed to download quotation:', error);
      showToast('error', error.message || 'Failed to download quotation PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const draftCount = quotations.filter((q) => q.status === 'Draft').length;
  const pendingCount = quotations.filter((q) => q.status === 'Pending Approval').length;
  const approvedCount = quotations.filter((q) => q.status === 'Approved').length;
  const sentCount = quotations.filter((q) => q.status === 'Sent').length;
  const convertedCount = quotations.filter((q) => q.status === 'Converted').length;

  return (
    <div className="space-y-6">
      {/* Global Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: FULL PAGE QUOTATION LIST */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#014582]" />
              Sales Quotations
              <span className="text-sm font-normal text-gray-400">({totalRecords} total)</span>
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentPage(1); fetchQuotations(); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={() => {
                  setEditingQuotation(null);
                  setViewMode('create');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" /> Create Quotation
              </button>
            </div>
          </div>

          {selectedLocation && (
            <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              Showing quotations for <strong>{selectedLocation.name}</strong>
              <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
            </div>
          )}

          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Draft', count: draftCount, color: 'text-gray-600 bg-gray-100', Icon: Clock },
              { label: 'Pending Approval', count: pendingCount, color: 'text-amber-700 bg-amber-100', Icon: Clock },
              { label: 'Approved', count: approvedCount, color: 'text-emerald-700 bg-emerald-100', Icon: CheckCircle },
              { label: 'Sent', count: sentCount, color: 'text-blue-700 bg-blue-100', Icon: Send },
              { label: 'Converted', count: convertedCount, color: 'text-purple-700 bg-purple-100', Icon: ShoppingCart },
            ].map(({ label, count, color, Icon }) => (
              <div key={`kpi-${label}`} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotation #, customer, email, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50 font-medium"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o === 'all' ? 'All Statuses' : o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-gray-500">Loading quotations...</p>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-500">No quotations found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first quotation to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Quote #', 'Customer', 'Status', 'Items', 'Total', 'Valid Until', 'Date', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quotation) => (
                      <tr 
                        key={quotation.id} 
                        className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer" 
                        onClick={() => handleQuotationClick(quotation)}
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-[#014582]">{quotation.quotationNumber}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{quotation.customerName}</p>
                          {quotation.customerEmail && <p className="text-xs text-gray-500">{quotation.customerEmail}</p>}
                        </td>
                        <td className="px-6 py-4"><span className={pill(STATUS_COLORS, quotation.status)}>{quotation.status}</span></td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{quotation.items?.length || 0}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(quotation.grandTotal)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(quotation.validUntil)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(quotation.quotationDate)}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuotationClick(quotation)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Full Page Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(quotation)}
                              disabled={actionLoading === `pdf-${quotation.id}`}
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Quick Action: Approve */}
                            {(quotation.status === 'Draft' || quotation.status === 'Pending Approval' || quotation.status === 'Sent') && (
                              <button
                                onClick={() => handleUpdateStatus(quotation.id, 'Approved', 'Quotation approved successfully!')}
                                disabled={actionLoading === `status-${quotation.id}`}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-all"
                                title="Approve Quotation"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {/* Quick Action: Create Sales Order */}
                            {(quotation.status === 'Approved' || quotation.status === 'Accepted' || quotation.status === 'Partially Converted') && (
                              <button
                                onClick={() => handleConvertQuotation(quotation.id)}
                                disabled={actionLoading === `convert-${quotation.id}`}
                                className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                                title="Create Sales Order"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                {quotation.status === 'Partially Converted' ? 'Convert Remaining' : 'Create Sales Order'}
                              </button>
                            )}

                            {quotation.status === 'Draft' && (
                              <button
                                onClick={() => handleDeleteQuotation(quotation.id)}
                                disabled={actionLoading === `delete-${quotation.id}`}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageLimit + 1}–{Math.min(currentPage * pageLimit, totalRecords)} of {totalRecords} quotations
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={!hasPrev}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={!hasNext}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: FULL PAGE QUOTATION DETAIL VIEW */}
      {viewMode === 'detail' && selectedQuotation && (
        <FullPageQuotationDetail
          quotation={selectedQuotation}
          onBack={() => { setViewMode('list'); fetchQuotations(); }}
          onApprove={() => handleUpdateStatus(selectedQuotation.id, 'Approved', 'Quotation approved successfully!')}
          onConvert={() => handleConvertQuotation(selectedQuotation.id)}
          onSend={() => handleUpdateStatus(selectedQuotation.id, 'Sent', 'Quotation marked as Sent to customer')}
          onCancel={() => handleUpdateStatus(selectedQuotation.id, 'Cancelled', 'Quotation cancelled')}
          onDownload={() => handleDownloadPDF(selectedQuotation)}
          onDelete={() => handleDeleteQuotation(selectedQuotation.id)}
          actionLoading={actionLoading}
        />
      )}

      {/* VIEW 3: FULL PAGE CREATE QUOTATION FORM */}
      {viewMode === 'create' && (
        <FullPageCreateQuotation
          editingQuotation={editingQuotation}
          onBack={() => setViewMode('list')}
          onSuccess={(msg) => {
            showToast('success', msg || 'Quotation created successfully');
            setViewMode('list');
            fetchQuotations();
          }}
        />
      )}
    </div>
  );
}

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}

// ============================================================================
// FULL PAGE QUOTATION DETAIL COMPONENT (NON-MODAL)
// ============================================================================
function FullPageQuotationDetail({
  quotation,
  onBack,
  onApprove,
  onConvert,
  onSend,
  onCancel,
  onDownload,
  onDelete,
  actionLoading,
}: {
  quotation: Quotation;
  onBack: () => void;
  onApprove: () => void;
  onConvert: () => void;
  onSend: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Approve: can approve from Draft, Pending Approval, OR Sent
  const canApprove = quotation.status === 'Draft' || quotation.status === 'Pending Approval' || quotation.status === 'Sent';
  // Create Sales Order: quotation must be Approved or Accepted
  const canCreateOrder = quotation.status === 'Approved' || quotation.status === 'Accepted' || quotation.status === 'Partially Converted';
  // Mark as Sent: only from Draft
  const canSend = quotation.status === 'Draft';
  // Can cancel
  const canCancel = ['Draft', 'Pending Approval', 'Approved', 'Sent'].includes(quotation.status);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Top Header Navigation */}
      <div className="bg-[#014582] text-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 text-sm font-medium text-white"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Quotations List
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{quotation.quotationNumber}</h1>
              <span className={pill(STATUS_COLORS, quotation.status)}>{quotation.status}</span>
            </div>
            <p className="text-white/80 text-sm mt-0.5">Customer: <strong>{quotation.customerName}</strong></p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onDownload}
            disabled={actionLoading === `pdf-${quotation.id}`}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          {canApprove && (
            <button
              onClick={onApprove}
              disabled={!!actionLoading}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Approve Quotation
            </button>
          )}

          {canCreateOrder && (
            <button
              onClick={onConvert}
              disabled={!!actionLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all shadow-lg flex items-center gap-2 border border-emerald-400"
            >
              <ShoppingCart className="w-5 h-5" /> Create Sales Order
            </button>
          )}

          {canSend && (
            <button
              onClick={onSend}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Mark as Sent
            </button>
          )}

          {canCancel && (
            <button
              onClick={onCancel}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-sm font-medium transition-all"
            >
              Cancel Quotation
            </button>
          )}
        </div>
      </div>

      {/* Main Content Details */}
      <div className="p-8 space-y-8">
        {/* Banner Alert for Approved State */}
        {canCreateOrder && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Quotation is Approved!</p>
                <p className="text-sm text-emerald-700">You can now generate an official Sales Order from this quotation with one click.</p>
              </div>
            </div>
            <button
              onClick={onConvert}
              disabled={!!actionLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <ShoppingCart className="w-4 h-4" /> Create Sales Order Now
            </button>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer Name</p>
            <p className="text-base font-bold text-gray-800">{quotation.customerName}</p>
            {quotation.customerEmail && <p className="text-xs text-gray-500">{quotation.customerEmail}</p>}
            {quotation.customerPhone && <p className="text-xs text-gray-500">{quotation.customerPhone}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quotation Date</p>
            <p className="text-base font-semibold text-gray-800">{formatDate(quotation.quotationDate)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Valid Until</p>
            <p className="text-base font-semibold text-gray-800">{formatDate(quotation.validUntil)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sales Person</p>
            <p className="text-base font-semibold text-gray-800">{quotation.salesPerson || 'N/A'}</p>
          </div>
        </div>

        {/* Product Items Table */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#014582]" /> Quotation Items ({quotation.items?.length || 0})
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {['#', 'Product Name', 'SKU', 'Qty', 'Unit Price', 'Disc %', 'Tax %', 'Line Total'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotation.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.discount || 0}%</td>
                    <td className="px-4 py-3 text-gray-600">{item.taxRate || 0}%</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-md bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500 font-medium">Total Discount</span>
              <span className="font-semibold text-red-500">-{formatCurrency(quotation.totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-500 font-medium">Total Tax</span>
              <span className="font-semibold text-blue-500">{formatCurrency(quotation.totalTax)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-xl">
              <span className="text-gray-800">Grand Total</span>
              <span className="text-[#014582]">{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(quotation.notes || quotation.termsConditions) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
            {quotation.notes && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
            {quotation.termsConditions && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.termsConditions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FULL PAGE CREATE QUOTATION FORM COMPONENT (NON-MODAL)
// ============================================================================
function FullPageCreateQuotation({
  editingQuotation,
  onBack,
  onSuccess,
}: {
  editingQuotation?: Quotation | null;
  onBack: () => void;
  onSuccess: (msg?: string) => void;
}) {
  const { selectedLocationId } = useLocationOptional();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer List State (Support Select & Deselect with checkboxes)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  // Product List State with Pagination & Selection (company-wide, all warehouses)
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productPageLimit = 10;

  // Selected Quotation Line Items
  const [lineDrafts, setLineDrafts] = useState<QuotationLineDraft[]>([]);

  // Details
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [salesPerson, setSalesPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [initialStatus, setInitialStatus] = useState<'Draft' | 'Pending Approval' | 'Approved'>('Draft');

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = customerSearch 
        ? `/api/customer/search?q=${encodeURIComponent(customerSearch)}&limit=20`
        : `/api/warehouse/customers?page=1&limit=20`;

      const response = await fetch(url, { headers });
      const result = await response.json();

      if (result.success && result.data) {
        const rows = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.data)
            ? result.data.data
            : [];
        setCustomerList(rows);
      } else {
        setCustomerList([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [customerSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // Fetch Products List — all warehouses (no location filter), with pagination
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: productPage.toString(),
        limit: productPageLimit.toString(),
      });
      if (productSearch) params.append('search', productSearch);

      const response = await fetch(`/api/warehouse/products?${params.toString()}`, { headers });
      const result = await response.json();

      if (result.success && result.data) {
        const rows = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.data)
            ? result.data.data
            : [];
        setProductList(rows);
        const pagination = result.pagination || result.data?.pagination;
        if (pagination) {
          setTotalProductPages(pagination.pages || 1);
          setTotalProducts(pagination.total || rows.length);
        } else {
          setTotalProductPages(1);
          setTotalProducts(rows.length);
        }
      } else {
        setProductList([]);
        setTotalProductPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProductList([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productPage, productSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Customer Toggle (Select & Deselect)
  const toggleCustomer = (customer: Customer) => {
    const isSelected = selectedCustomers.some((c) => c.id === customer.id);
    if (isSelected) {
      setSelectedCustomers(selectedCustomers.filter((c) => c.id !== customer.id));
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const isAllCustomersSelected = customerList.length > 0 && customerList.every((c) => selectedCustomers.some((sc) => sc.id === c.id));

  const toggleAllCustomers = () => {
    if (isAllCustomersSelected) {
      const currentIds = new Set(customerList.map((c) => c.id));
      setSelectedCustomers(selectedCustomers.filter((c) => !currentIds.has(c.id)));
    } else {
      const combined = [...selectedCustomers];
      customerList.forEach((c) => {
        if (!combined.some((sc) => sc.id === c.id)) {
          combined.push(c);
        }
      });
      setSelectedCustomers(combined);
    }
  };

  // Product Selection & Deselection
  const isProductSelected = (productId?: string) => {
    if (!productId) return false;
    return lineDrafts.some((line) => line.productId === productId);
  };

  const toggleProductSelection = (product: Product) => {
    const pId = product.id || product._id;
    if (!pId) return;

    if (isProductSelected(pId)) {
      setLineDrafts(lineDrafts.filter((line) => line.productId !== pId));
    } else {
      const newLine: QuotationLineDraft = {
        productId: pId,
        productName: product.name,
        sku: product.sku || '',
        quantity: 1,
        unitPrice: product.sellingPrice || 0,
        discount: 0,
        taxRate: product.taxRate || 0,
      };
      setLineDrafts([...lineDrafts, newLine]);
    }
  };

  const handleUpdateLine = (index: number, field: keyof QuotationLineDraft, value: number) => {
    const updated = [...lineDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setLineDrafts(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLineDrafts(lineDrafts.filter((_, i) => i !== index));
  };

  // Financial Computations
  const subtotal = lineDrafts.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  const totalDiscount = lineDrafts.reduce((sum, line) => sum + ((line.quantity * line.unitPrice) * (line.discount / 100)), 0);
  const totalTax = lineDrafts.reduce((sum, line) => {
    const taxable = (line.quantity * line.unitPrice) - ((line.quantity * line.unitPrice) * (line.discount / 100));
    return sum + (taxable * (line.taxRate / 100));
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Submit Handler: Supports creating multiple quotations for multiple selected customers
  const handleSubmit = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer from the list.');
      return;
    }
    if (lineDrafts.length === 0) {
      alert('Please select at least one product line item.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        customers: selectedCustomers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          company: c.company || '',
        })),
        quotationDate,
        validUntil,
        salesPerson: salesPerson || null,
        items: lineDrafts.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount,
          taxRate: line.taxRate,
        })),
        notes: notes || null,
        termsConditions: termsConditions || null,
        status: initialStatus,
        ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
      };

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.message || `${selectedCustomers.length} Quotation(s) created successfully!`);
      } else {
        alert(result.message || 'Failed to create quotation(s)');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-8 p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-gray-700 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="w-5 h-5" /> Back to List
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create Sales Quotation</h1>
            <p className="text-sm text-gray-500">Configure customer selection, product items, and approval status in page view.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCustomers.length === 0 || lineDrafts.length === 0}
            className="px-6 py-2.5 bg-[#014582] text-white rounded-xl hover:bg-[#01366a] font-bold text-sm transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {selectedCustomers.length > 1 ? `Create ${selectedCustomers.length} Quotations` : 'Create Quotation'}
          </button>
        </div>
      </div>

      {/* SECTION 1: CUSTOMERS SELECTION LIST (SELECT & DESELECT) */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#014582] text-white rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Step 1: Customer Selection List</h2>
              <p className="text-xs text-gray-500">Select or deselect customers. Creating will generate a separate quotation for each selected customer!</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#014582]/10 text-[#014582] font-bold text-xs rounded-full">
            {selectedCustomers.length} Customer(s) Selected
          </span>
        </div>

        {/* Customer Search & Selected Tags */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer by name, email, phone, company..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>

          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-400 font-semibold uppercase">Selected:</span>
              {selectedCustomers.map((cust) => (
                <span key={cust.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#014582]/30 text-[#014582] rounded-full text-xs font-semibold shadow-sm">
                  {cust.name}
                  <button onClick={() => toggleCustomer(cust)} className="hover:text-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Customers Table with Checkboxes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
          {isLoadingCustomers ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#014582]" /> Loading customers...
            </div>
          ) : customerList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No customers found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left w-12">
                    <button type="button" onClick={toggleAllCustomers} className="flex items-center">
                      {isAllCustomersSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#014582]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Customer Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerList.map((cust) => {
                  const selected = selectedCustomers.some((sc) => sc.id === cust.id);
                  return (
                    <tr 
                      key={cust.id} 
                      onClick={() => toggleCustomer(cust)}
                      className={`cursor-pointer transition-colors ${selected ? 'bg-[#014582]/5' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-2.5">
                        {selected ? (
                          <CheckSquare className="w-4 h-4 text-[#014582]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{cust.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{cust.email || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{cust.phone || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{cust.company || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: PRODUCTS SELECTION LIST (PAGINATION + SELECT/DESELECT) */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Step 2: Products Selection List</h2>
              <p className="text-xs text-gray-500">
                All warehouse products (company-wide), paginated. Select items then set qty, price, discount &amp; tax below.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">
            {lineDrafts.length} Item(s) Selected
          </span>
        </div>

        {/* Product Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={productSearch}
            onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Products Table with Selection Checkboxes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoadingProducts ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Loading product catalog...
            </div>
          ) : productList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left w-12">Select</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Product Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">SKU</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Stock Qty</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Unit</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Selling Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Tax %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productList.map((prod) => {
                    const pId = prod.id || prod._id;
                    const selected = isProductSelected(pId);
                    const stockQty = prod.availableStock ?? prod.currentStock ?? 0;
                    return (
                      <tr 
                        key={pId} 
                        onClick={() => toggleProductSelection(prod)}
                        className={`cursor-pointer transition-colors ${selected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-2.5">
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-gray-800">{prod.name}</p>
                          {prod.barcodeNumber && (
                            <p className="text-[11px] font-mono text-gray-400">Barcode: {prod.barcodeNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{prod.sku || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{prod.categoryName || '-'}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${stockQty <= 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {stockQty}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{prod.stockUnitName || 'Pcs'}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-700">{formatCurrency(prod.sellingPrice || 0)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{prod.taxRate || 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Product Pagination Footer — always visible when products exist */}
          {(totalProducts > 0 || totalProductPages > 1) && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {productPage} of {Math.max(totalProductPages, 1)}
                {' '}({totalProducts} products · {productPageLimit} per page)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1 || isLoadingProducts}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setProductPage((p) => Math.min(Math.max(totalProductPages, 1), p + 1))}
                  disabled={productPage >= totalProductPages || isLoadingProducts}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Line Items Configuration Table */}
        {lineDrafts.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Configure Selected Quotation Line Items</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-24">Qty</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-32">Unit Price</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-24">Disc %</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 w-32">Tax Rate</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Line Total</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineDrafts.map((line, index) => {
                    const lineSub = line.quantity * line.unitPrice;
                    const lineDisc = lineSub * (line.discount / 100);
                    const lineTaxable = lineSub - lineDisc;
                    const lineTax = lineTaxable * (line.taxRate / 100);
                    const lineTot = lineTaxable + lineTax;

                    return (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{line.productName}</p>
                          <p className="text-xs font-mono text-gray-400">SKU: {line.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={line.quantity === 0 ? '' : line.quantity}
                            placeholder="Qty"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '-') {
                                handleUpdateLine(index, 'quantity', 0);
                                return;
                              }
                              const parsed = parseInt(raw);
                              if (!isNaN(parsed) && parsed >= 0) {
                                handleUpdateLine(index, 'quantity', parsed);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice === 0 ? '' : line.unitPrice}
                            placeholder="Price"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '-') {
                                handleUpdateLine(index, 'unitPrice', 0);
                                return;
                              }
                              const parsed = parseFloat(raw);
                              if (!isNaN(parsed) && parsed >= 0) {
                                handleUpdateLine(index, 'unitPrice', parsed);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={line.discount === 0 ? '' : line.discount}
                            placeholder="0%"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '-') {
                                handleUpdateLine(index, 'discount', 0);
                                return;
                              }
                              const parsed = parseFloat(raw);
                              if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                                handleUpdateLine(index, 'discount', parsed);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <TaxRateSelect
                            value={line.taxRate}
                            onChange={(rate) => handleUpdateLine(index, 'taxRate', rate)}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                          {formatCurrency(lineTot)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Card */}
            <div className="flex justify-end pt-2">
              <div className="w-full max-w-sm bg-white rounded-xl p-4 border border-gray-200 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-red-500">
                  <span>Total Discount</span>
                  <span className="font-semibold">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-500">
                  <span>Total Tax</span>
                  <span className="font-semibold">{formatCurrency(totalTax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-800">
                  <span>Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: QUOTATION DETAILS & APPROVAL FLOW STATUS */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Step 3: Quotation Details & Initial Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Quotation Date *</label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Valid Until *</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Initial Status Workflow</label>
            <select
              value={initialStatus}
              onChange={(e: any) => setInitialStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#014582] text-gray-800"
            >
              <option value="Draft">Draft (Editable draft)</option>
              <option value="Pending Approval">Pending Approval (Awaiting Sign-off)</option>
              <option value="Approved">Approved (Ready to create Sales Order!)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Sales Person (Optional)</label>
          <input
            type="text"
            placeholder="Name of sales representative"
            value={salesPerson}
            onChange={(e) => setSalesPerson(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014582]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Notes (Optional)</label>
            <textarea
              placeholder="Internal or customer notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Terms & Conditions (Optional)</label>
            <textarea
              placeholder="Payment terms, delivery conditions..."
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Submit Action */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <button type="button" onClick={onBack} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-all">
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || selectedCustomers.length === 0 || lineDrafts.length === 0}
          className="px-8 py-3 bg-[#014582] text-white rounded-xl hover:bg-[#01366a] font-bold text-base transition-all shadow-xl shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {selectedCustomers.length > 1 ? `Create ${selectedCustomers.length} Quotations` : 'Create Sales Quotation'}
        </button>
      </div>
    </div>
  );
}
