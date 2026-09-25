'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Calendar, Package, Truck, Receipt,
  CheckCircle, Loader2, X, ChevronLeft, ChevronRight, AlertCircle, MapPin, Info
} from 'lucide-react';
import { useLocationOptional } from '@/lib/location-context';
import { SalesNumberInput } from '@/components/sales/sales-number-input';

interface SourceItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  discount?: number;
  taxRate?: number;
}

interface SourceDocument {
  id: string;
  docNumber: string;
  type: 'order' | 'delivery';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string;
  date: string;
  status: string;
  locationId?: string;
  items: SourceItem[];
}

interface LineDraft {
  sourceId: string;
  sourceType: 'order' | 'delivery';
  docNumber: string;
  orderId?: string;
  deliveryId?: string;
  productId: string;
  productName: string;
  sku: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  selected: boolean;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { selectedLocationId, selectedLocation } = useLocationOptional();

  // Tab: orders vs deliveries
  const [sourceTab, setSourceTab] = useState<'orders' | 'deliveries'>('orders');

  // Sources list state
  const [availableDocs, setAvailableDocs] = useState<SourceDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Selected Documents & Line items
  const [selectedDocs, setSelectedDocs] = useState<SourceDocument[]>([]);
  const [lineDrafts, setLineDrafts] = useState<LineDraft[]>([]);

  // Invoice header form fields
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default due date (30 days from today)
  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    setDueDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch available orders or deliveries for invoicing
  const fetchAvailableDocs = useCallback(async () => {
    setIsLoadingDocs(true);
    setFormError('');
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = sourceTab === 'orders'
        ? '/api/sales-invoices/available-orders'
        : '/api/sales-invoices/available-deliveries';

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedLocationId) params.append('locationId', selectedLocationId);

      const response = await fetch(`${endpoint}?${params.toString()}`, { headers });
      const result = await response.json();

      if (result.success) {
        const rows = Array.isArray(result.data) ? result.data : [];
        const formatted: SourceDocument[] = rows.map((r: any) => ({
          id: r.id,
          docNumber: r.orderNumber || r.deliveryNumber || r.salesOrderNumber || r.id,
          type: sourceTab === 'orders' ? 'order' : 'delivery',
          customerName: r.customerName || r.customer?.name || 'Unknown Customer',
          customerEmail: r.customerEmail || r.customer?.email,
          customerPhone: r.customerPhone || r.customer?.phone,
          customerId: r.customerId || r.customer?.id,
          date: r.orderDate || r.deliveryDate || r.createdAt,
          status: r.orderStatus || r.deliveryStatus || 'Pending',
          locationId: r.locationId,
          items: (r.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName || item.product?.name || 'Product',
            sku: item.sku || item.product?.sku || '',
            quantity: item.quantity || item.deliveredQuantity || item.orderedQuantity || 1,
            unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? Number(item.unitPrice) : (item.price || item.product?.sellingPrice || 0),
            discount: Number(item.discount || 0),
            taxRate: Number(item.taxRate || 0),
          })),
        }));

        setAvailableDocs(formatted);
        const pag = result.pagination;
        if (pag) {
          setTotalPages(pag.pages || 1);
          setTotalRecords(pag.total || 0);
          setHasNext(Boolean(pag.hasNext));
          setHasPrev(Boolean(pag.hasPrev));
        }
      } else {
        setAvailableDocs([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch available documents for invoicing:', err);
      setAvailableDocs([]);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [sourceTab, currentPage, searchQuery, selectedLocationId]);

  useEffect(() => {
    fetchAvailableDocs();
  }, [fetchAvailableDocs]);

  // Tab or Search change
  const handleTabChange = (tab: 'orders' | 'deliveries') => {
    setSourceTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Toggle selection of a source document (Order or Delivery)
  const handleToggleSelectDoc = (doc: SourceDocument) => {
    const isAlreadySelected = selectedDocs.some((d) => d.id === doc.id);

    if (isAlreadySelected) {
      // Deselect doc
      const updatedDocs = selectedDocs.filter((d) => d.id !== doc.id);
      setSelectedDocs(updatedDocs);
      setLineDrafts((prev) => prev.filter((item) => item.sourceId !== doc.id));
      setFormError('');
      return;
    }

    // Validate same customer constraint
    if (selectedDocs.length > 0) {
      const primaryCustomer = (selectedDocs[0].customerName || '').toLowerCase().trim();
      const newCustomer = (doc.customerName || '').toLowerCase().trim();

      if (primaryCustomer !== newCustomer) {
        setFormError(
          `⚠️ All selected documents must belong to the same customer. Selected document(s) are for "${selectedDocs[0].customerName}", but "${doc.docNumber}" is for "${doc.customerName}".`
        );
        return;
      }
    }

    // Select doc and build line drafts
    setSelectedDocs((prev) => [...prev, doc]);
    setFormError('');

    const newDrafts: LineDraft[] = doc.items.map((item) => {
      const qty = item.quantity || 1;
      return {
        sourceId: doc.id,
        sourceType: doc.type,
        docNumber: doc.docNumber,
        orderId: doc.type === 'order' ? doc.id : undefined,
        deliveryId: doc.type === 'delivery' ? doc.id : undefined,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        maxQuantity: qty,
        quantity: qty,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        selected: true,
      };
    });

    setLineDrafts((prev) => [...prev, ...newDrafts]);
  };

  // Handle line draft changes
  const handleItemSelectToggle = (index: number, selected: boolean) => {
    setLineDrafts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected };
      return updated;
    });
  };

  const handleUpdateItemField = (index: number, field: keyof LineDraft, value: any) => {
    setLineDrafts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculate totals
  const activeItems = lineDrafts.filter((l) => l.selected);

  const subtotal = activeItems.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const totalDiscount = activeItems.reduce(
    (sum, l) => sum + (l.quantity * l.unitPrice * (l.discount || 0)) / 100,
    0
  );
  const taxableTotal = subtotal - totalDiscount;
  const totalTax = activeItems.reduce(
    (sum, l) =>
      sum + ((l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100)) * (l.taxRate || 0)) / 100,
    0
  );
  const grandTotal = taxableTotal + totalTax;

  const hasSalesOrderSources = selectedDocs.some((d) => d.type === 'order');

  // Submit invoice creation
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (selectedDocs.length === 0) {
      setFormError('⚠️ Please select at least one Sales Order or Delivery from the list.');
      return;
    }

    if (activeItems.length === 0) {
      setFormError('⚠️ Please select at least one item to include in the invoice.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const orderIds = selectedDocs.filter((d) => d.type === 'order').map((d) => d.id);
      const deliveryIds = selectedDocs.filter((d) => d.type === 'delivery').map((d) => d.id);

      const payload = {
        orderIds,
        deliveryIds,
        dueDate,
        paymentTerms,
        notes: notes.trim() || null,
        locationId: selectedLocationId || selectedDocs[0]?.locationId || undefined,
        items: activeItems.map((l) => ({
          orderId: l.orderId,
          deliveryId: l.deliveryId,
          productId: l.productId,
          productName: l.productName,
          sku: l.sku,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxRate: l.taxRate,
        })),
      };

      const response = await fetch('/api/sales-invoices/create-multi', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/sales/invoices');
      } else {
        setFormError(result.message || 'Failed to create sales invoice');
      }
    } catch (err: any) {
      console.error('Create invoice error:', err);
      setFormError(err.message || 'An error occurred while creating sales invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/sales/invoices')}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#014582] transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[#014582]" /> Create Sales Invoice
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Select pending Sales Orders or Sales Deliveries for the same customer to create a single invoice.
          </p>
        </div>

        {selectedLocation && (
          <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            Invoicing from <strong>{selectedLocation.name}</strong>
            <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
          </div>
        )}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ── STEP 1: SOURCE DOCUMENTS SELECTION (ORDERS / DELIVERIES) ─────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Source Selector Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                sourceTab === 'orders'
                  ? 'bg-white text-[#014582] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" /> Sales Orders
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('deliveries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                sourceTab === 'deliveries'
                  ? 'bg-white text-[#014582] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-4 h-4" /> Sales Deliveries
            </button>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${sourceTab}...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Source Documents Table */}
        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
            <span className="ml-3 text-sm text-gray-500 font-medium">
              Loading available {sourceTab}...
            </span>
          </div>
        ) : availableDocs.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center w-16">Select</th>
                  <th className="px-4 py-3">{sourceTab === 'orders' ? 'Order #' : 'Delivery #'}</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableDocs.map((doc) => {
                  const isSelected = selectedDocs.some((d) => d.id === doc.id);
                  const isDifferentCustomer =
                    selectedDocs.length > 0 &&
                    selectedDocs[0].customerName.toLowerCase().trim() !==
                      doc.customerName.toLowerCase().trim();

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => handleToggleSelectDoc(doc)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/80 font-medium'
                          : isDifferentCustomer
                          ? 'hover:bg-amber-50/40 opacity-75'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectDoc(doc)}
                          className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#014582]">{doc.docNumber}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {doc.customerName}
                        {doc.customerPhone && (
                          <span className="block text-xs text-gray-400">{doc.customerPhone}</span>
                        )}
                        {isDifferentCustomer && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Different customer
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {doc.date ? new Date(doc.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {doc.items.length} item(s)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
            <p className="text-sm font-semibold text-gray-700">
              No available {sourceTab} found for invoicing
            </p>
            <p className="text-xs text-gray-400">
              {searchQuery
                ? `No ${sourceTab} match "${searchQuery}"`
                : `All ${sourceTab} for this location are either fully invoiced or completed.`}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              Showing {availableDocs.length} of {totalRecords} records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev || isLoadingDocs}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs font-semibold text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext || isLoadingDocs}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── STEP 2: SELECTED DOCUMENTS SUMMARY & INVOICE ITEMS FORM ────────── */}
      {selectedDocs.length > 0 && (
        <form onSubmit={handleSubmitInvoice} className="space-y-6">
          {/* Selected Docs Banner */}
          <div className="bg-[#014582]/10 border border-[#014582]/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#014582]" />
                <h3 className="font-bold text-gray-900">
                  Selected Documents ({selectedDocs.length}):{' '}
                  <span className="text-[#014582]">
                    {selectedDocs.map((d) => d.docNumber).join(', ')}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Customer: <strong>{selectedDocs[0].customerName}</strong>
                {selectedDocs[0].customerEmail && ` • Email: ${selectedDocs[0].customerEmail}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDocs([]);
                setLineDrafts([]);
                setFormError('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Deselect All Documents
            </button>
          </div>

          {/* Auto-Delivery Creation Informational Notice */}
          {hasSalesOrderSources && (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-4 flex items-start gap-3 text-xs">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-900 text-sm">Auto-Delivery Confirmation Active</p>
                <p className="mt-0.5 text-sky-800">
                  For selected Sales Orders that do not have a confirmed delivery yet, a confirmed Sales Delivery will be <strong>automatically created & stock deducted</strong> when this invoice is created.
                </p>
              </div>
            </div>
          )}

          {/* Line Items Selection & Editable Quantities / Prices */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#014582]" /> Invoice Line Items & Pricing
              </h3>
              <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                {activeItems.length} line item(s) selected
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">Include</th>
                    <th className="px-4 py-3">Doc #</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Available Qty</th>
                    <th className="px-4 py-3 text-right min-w-[120px]">Invoice Qty</th>
                    <th className="px-4 py-3 text-right min-w-[120px]">Unit Price ($)</th>
                    <th className="px-4 py-3 text-right min-w-[90px]">Disc %</th>
                    <th className="px-4 py-3 text-right min-w-[90px]">Tax %</th>
                    <th className="px-4 py-3 text-right font-bold">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineDrafts.map((line, index) => {
                    const lineTotal =
                      line.quantity *
                      line.unitPrice *
                      (1 - (line.discount || 0) / 100) *
                      (1 + (line.taxRate || 0) / 100);

                    return (
                      <tr key={`${line.sourceId}-${line.productId}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={line.selected}
                            onChange={(e) => handleItemSelectToggle(index, e.target.checked)}
                            className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#014582] text-xs">
                          {line.docNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{line.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{line.sku}</td>
                        <td className="px-4 py-3 text-right text-gray-600 font-semibold">
                          {line.maxQuantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.selected ? (
                            <SalesNumberInput
                              min={1}
                              max={line.maxQuantity}
                              value={line.quantity}
                              onChange={(val) => handleUpdateItemField(index, 'quantity', val)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#014582] text-center inline-block"
                            />
                          ) : (
                            <span className="text-xs text-gray-400 italic">Excluded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.selected ? (
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                handleUpdateItemField(index, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#014582] text-right inline-block"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.selected ? (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={line.discount}
                              onChange={(e) =>
                                handleUpdateItemField(index, 'discount', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#014582] text-right inline-block"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.selected ? (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={line.taxRate}
                              onChange={(e) =>
                                handleUpdateItemField(index, 'taxRate', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#014582] text-right inline-block"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {line.selected ? `$${lineTotal.toFixed(2)}` : '$0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Header Details & Financial Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#014582]" /> Invoice Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                  >
                    <option value="Net 30">Net 30 (30 Days)</option>
                    <option value="Net 15">Net 15 (15 Days)</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Cash">Cash / Immediate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Additional terms, instructions, or notes for customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Financial Summary Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount Total</span>
                  <span className="font-semibold text-emerald-600">-${totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax Total</span>
                  <span className="font-semibold text-gray-900">${totalTax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-[#014582] text-xl">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || activeItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating & Posting Invoice...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Create & Post Sales Invoice
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/sales/invoices')}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </form>
      )}
    </div>
  );
}
