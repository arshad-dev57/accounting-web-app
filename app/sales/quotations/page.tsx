'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, FileText, Clock, 
  CheckCircle, Loader2, X, ChevronDown, Eye, Trash2, MapPin, Ban, ShoppingCart
} from 'lucide-react';
import { Quotation } from '@/lib/types/quotation';
import CreateQuotationWizard from '@/components/quotations/CreateQuotationWizard';
import { useLocation } from '@/lib/location-context';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Expired: 'bg-gray-100 text-gray-700',
  Converted: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-gray-100 text-gray-700',
};

const pill = (map: Record<string, string>, val: string) =>
  `text-xs font-semibold px-2.5 py-1 rounded-full ${map[val] ?? 'bg-gray-100 text-gray-700'}`;

const STATUS_OPTIONS = ['all', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted', 'Cancelled'];

export default function QuotationsPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedLocationId) params.append('locationId', selectedLocationId);

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quotations?${params.toString()}`, {
        headers,
      });
      const result = await response.json();

      if (result.success && result.data) {
        setQuotations(result.data);
        if (result.pagination) {
          setTotalRecords(result.pagination.total);
          setTotalPages(result.pagination.pages);
          setHasNext(result.pagination.hasNext);
          setHasPrev(result.pagination.hasPrev);
        }
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

  const handleCreateSuccess = () => {
    setShowCreateWizard(false);
    fetchQuotations();
  };

  const handleQuotationClick = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowDetailModal(true);
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) return;
    setActionLoading(`delete-${quotationId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (result.success) {
        fetchQuotations();
      } else {
        alert(result.message || 'Failed to delete quotation');
      }
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      alert('Failed to delete quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelQuotation = async (quotation: Quotation) => {
    // Draft → Cancelled; Sent → Rejected (backend status transitions)
    const nextStatus = quotation.status === 'Draft' ? 'Cancelled' : 'Rejected';
    if (!confirm(`Are you sure you want to cancel this quotation?`)) return;
    setActionLoading(`cancel-${quotation.id}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quotations/${quotation.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus, notes: 'Cancelled by user' }),
      });
      const result = await response.json();
      if (result.success) {
        if (selectedQuotation?.id === quotation.id) {
          setShowDetailModal(false);
          setSelectedQuotation(null);
        }
        fetchQuotations();
      } else {
        alert(result.message || 'Failed to cancel quotation');
      }
    } catch (error) {
      console.error('Failed to cancel quotation:', error);
      alert('Failed to cancel quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertQuotation = async (quotationId: string) => {
    if (!confirm('Convert this quotation to a sales order?')) return;
    setActionLoading(`convert-${quotationId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quotations/${quotationId}/convert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result.success) {
        if (selectedQuotation?.id === quotationId) {
          setShowDetailModal(false);
          setSelectedQuotation(null);
        }
        fetchQuotations();
      } else {
        alert(result.message || 'Failed to convert quotation');
      }
    } catch (error) {
      console.error('Failed to convert quotation:', error);
      alert('Failed to convert quotation');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const draftCount = quotations.filter((q) => q.status === 'Draft').length;
  const sentCount = quotations.filter((q) => q.status === 'Sent').length;
  const acceptedCount = quotations.filter((q) => q.status === 'Accepted').length;

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#014582]" />
          Quotations
          <span className="text-sm font-normal text-gray-400">({totalRecords} quotations)</span>
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCurrentPage(1); fetchQuotations(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowCreateWizard(true)}
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

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Draft', count: draftCount, color: 'orange', Icon: Clock },
          { label: 'Sent', count: sentCount, color: 'blue', Icon: Loader2 },
          { label: 'Accepted', count: acceptedCount, color: 'green', Icon: CheckCircle },
        ].map(({ label, count, color, Icon }) => (
          <div key={`kpi-${label}`} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{count}</p>
              </div>
              <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
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
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o === 'all' ? 'All Status' : o}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
            <p className="mt-2 text-gray-500">Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No quotations yet</p>
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
                  <tr key={quotation.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleQuotationClick(quotation)}>
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-[#014582]">{quotation.quotationNumber}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{quotation.customerName}</p>
                      {quotation.customerEmail && <p className="text-xs text-gray-500">{quotation.customerEmail}</p>}
                    </td>
                    <td className="px-6 py-3"><span className={pill(STATUS_COLORS, quotation.status)}>{quotation.status}</span></td>
                    <td className="px-6 py-3 text-gray-600">{quotation.items.length}</td>
                    <td className="px-6 py-3 font-semibold text-gray-700">{formatCurrency(quotation.grandTotal)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(quotation.validUntil)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(quotation.quotationDate)}</td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuotationClick(quotation)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(quotation.status === 'Draft' || quotation.status === 'Sent') && (
                          <button
                            onClick={() => handleCancelQuotation(quotation)}
                            disabled={actionLoading === `cancel-${quotation.id}`}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {quotation.status === 'Accepted' && (
                          <button
                            onClick={() => handleConvertQuotation(quotation.id)}
                            disabled={actionLoading === `convert-${quotation.id}`}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                            title="Convert to Order"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        {quotation.status === 'Draft' && (
                          <button
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            disabled={actionLoading?.startsWith('delete-')}
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

      {showCreateWizard && (
        <CreateQuotationWizard
          onClose={() => setShowCreateWizard(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showDetailModal && selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          onClose={() => setShowDetailModal(false)}
          onCancel={
            selectedQuotation.status === 'Draft' || selectedQuotation.status === 'Sent'
              ? () => handleCancelQuotation(selectedQuotation)
              : undefined
          }
          onConvert={
            selectedQuotation.status === 'Accepted'
              ? () => handleConvertQuotation(selectedQuotation.id)
              : undefined
          }
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

function QuotationDetailModal({
  quotation,
  onClose,
  onCancel,
  onConvert,
  actionLoading,
}: {
  quotation: Quotation;
  onClose: () => void;
  onCancel?: () => void;
  onConvert?: () => void;
  actionLoading?: string | null;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{quotation.quotationNumber}</h2>
            <p className="text-sm text-gray-500">{quotation.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className={pill(STATUS_COLORS, quotation.status)}>{quotation.status}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quotation Date</p>
              <p className="text-sm text-gray-700">{formatDate(quotation.quotationDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Valid Until</p>
              <p className="text-sm text-gray-700">{formatDate(quotation.validUntil)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sales Person</p>
              <p className="text-sm text-gray-700">{quotation.salesPerson || 'N/A'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'SKU', 'Qty', 'Price', 'Disc %', 'Tax %', 'Total'].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-2 text-gray-600">{item.sku}</td>
                      <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-gray-600">{item.discount}%</td>
                      <td className="px-4 py-2 text-gray-600">{item.taxRate}%</td>
                      <td className="px-4 py-2 font-semibold text-gray-800">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500">Discount</span>
              <span className="text-red-500">-{formatCurrency(quotation.totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-500">Tax</span>
              <span className="text-blue-500">{formatCurrency(quotation.totalTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
              <span className="text-gray-800">Grand Total</span>
              <span className="text-[#014582]">{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>

          {quotation.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700">{quotation.notes}</p>
            </div>
          )}

          {quotation.termsConditions && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Terms & Conditions</p>
              <p className="text-sm text-gray-700">{quotation.termsConditions}</p>
            </div>
          )}

          {(onCancel || onConvert) && (
            <div className="border-t border-gray-100 pt-4 flex gap-3">
              {onConvert && (
                <button
                  onClick={onConvert}
                  disabled={!!actionLoading}
                  className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  Convert to Order
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  disabled={!!actionLoading}
                  className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
