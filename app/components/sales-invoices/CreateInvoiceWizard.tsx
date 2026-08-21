'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { OrderForInvoicing, InvoiceLineDraft } from '@/types/sales-invoice';
import TaxRateSelect from '../../../components/TaxRateSelect';
import { computeTaxLine, taxService, type TaxPricingModel } from '../../../lib/tax-service';
import { useLocation } from '@/lib/location-context';

interface CreateInvoiceWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceWizard({ onClose, onSuccess }: CreateInvoiceWizardProps) {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [step, setStep] = useState(0);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<OrderForInvoicing[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderForInvoicing | null>(null);
  const [lineDrafts, setLineDrafts] = useState<InvoiceLineDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [pricingModel, setPricingModel] = useState<TaxPricingModel>('exclusive');

  useEffect(() => {
    taxService.context().then((r) => {
      if (r.data?.pricingModel) setPricingModel(r.data.pricingModel);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderSearchQuery.length >= 2) {
        searchOrders(orderSearchQuery);
      } else {
        setOrderSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [orderSearchQuery, selectedLocationId]);

  // Clear selection when warehouse changes
  useEffect(() => {
    setSelectedOrder(null);
    setLineDrafts([]);
    setOrderSearchResults([]);
    if (orderSearchQuery.length >= 2) {
      searchOrders(orderSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  const searchOrders = async (query: string) => {
    if (!selectedLocationId) {
      setOrderSearchResults([]);
      return;
    }
    try {
      setIsSearchingOrders(true);
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Hit backend path via Next rewrite (not /api/sales-invoices which 404s on BE)
      const params = new URLSearchParams({
        search: query,
        limit: '10',
        locationId: selectedLocationId,
      });

      const response = await fetch(
        `/api/sales/invoices/available-orders?${params.toString()}`,
        { headers }
      );
      const result = await response.json();

      if (result.success && result.data) {
        setOrderSearchResults(result.data);
      } else {
        setOrderSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search orders:', error);
      setOrderSearchResults([]);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const selectOrder = (order: OrderForInvoicing) => {
    setSelectedOrder(order);
    setOrderSearchQuery(order.orderNumber);
    setOrderSearchResults([]);

    const drafts = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
    }));
    setLineDrafts(drafts);
  };

  const updateLineDraft = (index: number, field: keyof InvoiceLineDraft, value: number) => {
    setLineDrafts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateLineTotal = (line: InvoiceLineDraft) => {
    return computeTaxLine(line.quantity, line.unitPrice, line.discount, line.taxRate, pricingModel).lineTotal;
  };

  const selectedSubtotal = lineDrafts.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const selectedTotalDiscount = lineDrafts.reduce((sum, line) => {
    const subtotal = line.quantity * line.unitPrice;
    return sum + subtotal * (line.discount / 100);
  }, 0);
  const selectedTotalTax = lineDrafts.reduce((sum, line) => {
    return sum + computeTaxLine(line.quantity, line.unitPrice, line.discount, line.taxRate, pricingModel).taxAmount;
  }, 0);
  const selectedGrandTotal = pricingModel === 'inclusive'
    ? selectedSubtotal - selectedTotalDiscount
    : selectedSubtotal - selectedTotalDiscount + selectedTotalTax;
  const totalItems = lineDrafts.reduce((sum, line) => sum + line.quantity, 0);

  const nextStep = () => {
    if (step === 0 && !selectedOrder) {
      alert('Please select an order first');
      return;
    }
    if (step === 1 && lineDrafts.length === 0) {
      alert('Please add at least one item');
      return;
    }
    if (step < 2) setStep(step + 1);
  };

  const previousStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const createInvoice = async () => {
    if (!selectedOrder) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        orderId: selectedOrder.id,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: paymentTerms || 'Net 30',
        notes: notes || null,
        ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
      };

      const response = await fetch('/api/sales-invoices/from-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert('Invoice created successfully');
        onSuccess();
        onClose();
      } else {
        alert(result.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Sales Invoice</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step >= i ? 'bg-[#014582]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-medium text-gray-500">
            <span className={step === 0 ? 'text-[#014582]' : ''}>1. Find Order</span>
            <span className={step === 1 ? 'text-[#014582]' : ''}>2. Review Items</span>
            <span className={step === 2 ? 'text-[#014582]' : ''}>3. Invoice Details</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Find Order</h3>
              {selectedLocation ? (
                <p className="text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                  Searching orders for <strong>{selectedLocation.name}</strong>
                  <span className="text-sky-600 font-mono text-xs ml-1">({selectedLocation.code})</span>
                </p>
              ) : (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Select a warehouse from the top bar first
                </p>
              )}
              <input
                type="text"
                placeholder="Search order # or customer..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                disabled={!selectedLocationId}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014582] disabled:bg-gray-50 disabled:text-gray-400"
              />
              {isSearchingOrders && (
                <div className="text-center text-gray-500 py-4">Searching...</div>
              )}
              <div className="space-y-2">
                {orderSearchResults.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => selectOrder(order)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between text-left bg-white transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.customerName} • {order.items.length} items
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
              {selectedOrder && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="font-semibold text-[#014582]">{selectedOrder.orderNumber}</p>
                  <p className="text-gray-700">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.items.length} items ready for invoicing</p>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Review Items</h3>
              <div className="space-y-3">
                {lineDrafts.map((line, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{line.productName}</p>
                        <p className="text-xs text-gray-500">SKU: {line.sku}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(line.unitPrice)}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Qty</label>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={line.quantity}
                          onChange={(e) => updateLineDraft(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLineDraft(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Disc%</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={line.discount}
                          onChange={(e) => updateLineDraft(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Tax</label>
                        <TaxRateSelect
                          value={line.taxRate}
                          onChange={(rate) => updateLineDraft(index, 'taxRate', rate)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-xs text-gray-500">Line Total: </span>
                      <span className="font-semibold text-sm text-gray-900">{formatCurrency(calculateLineTotal(line))}</span>
                    </div>
                  </div>
                ))}
              </div>
              {lineDrafts.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTotalDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedTotalTax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Total Items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate.toISOString().split('T')[0]}
                    onChange={(e) => setInvoiceDate(new Date(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate.toISOString().split('T')[0]}
                    onChange={(e) => setDueDate(new Date(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Customer</span>
                  <span className="font-semibold text-gray-900">{selectedOrder?.customerName || ''}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Order #</span>
                  <span className="font-semibold text-gray-900">{selectedOrder?.orderNumber || ''}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Items</span>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-blue-100 pt-2">
                  <span>Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-white flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={previousStep}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-lg hover:bg-[#013a6e] transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={createInvoice}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-lg hover:bg-[#013a6e] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
