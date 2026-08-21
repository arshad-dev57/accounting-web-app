'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { OrderForDelivery, OrderItemForDelivery, DeliveryLineDraft } from '@/types/delivery';
import { useLocationOptional } from '@/lib/location-context';

interface CreateDeliveryWizardProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function CreateDeliveryWizard({ onSuccess, onClose }: CreateDeliveryWizardProps) {
  const { selectedLocationId } = useLocationOptional();
  const [wizardStep, setWizardStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  
  const [orderSearchResults, setOrderSearchResults] = useState<OrderForDelivery[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderForDelivery | null>(null);
  const [lineDrafts, setLineDrafts] = useState<DeliveryLineDraft[]>([]);
  
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Set default delivery date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Re-scope order search when warehouse changes
  useEffect(() => {
    setSelectedOrder(null);
    setOrderSearchResults([]);
    setOrderSearchQuery('');
  }, [selectedLocationId]);

  const searchOrders = async (query: string) => {
    if (query.trim().length < 2) {
      setOrderSearchResults([]);
      return;
    }

    try {
      setIsSearchingOrders(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        search: query,
        limit: '10',
      });
      if (selectedLocationId) params.set('locationId', selectedLocationId);
      if (!selectedLocationId) {
        setOrderSearchResults([]);
        setIsSearchingOrders(false);
        return;
      }
      const response = await fetch(
        `/api/deliveries/available-orders?${params.toString()}`,
        {
          headers,
        }
      );
      const result = await response.json();
      console.log('Available orders response:', result);

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

  const selectOrder = (order: OrderForDelivery) => {
    setSelectedOrder(order);
    setOrderSearchQuery(order.orderNumber);
    setOrderSearchResults([]);
    
    // Backend returns remainingItems, not items
    const items = order.remainingItems || order.items || [];
    console.log('Order items:', items);
    const drafts = items.map((item: any) => {
      const remainingQty = item.remainingQuantity || (item.quantity - (item.deliveredQuantity || 0));
      console.log('Item:', item, 'Remaining calculated:', remainingQty);
      return {
        productId: item.productId,
        productName: item.productName || item.name,
        sku: item.sku,
        orderQuantity: item.quantity,
        remainingQuantity: remainingQty,
        unit: item.unit,
        selected: remainingQty > 0,
        deliveryQuantity: remainingQty > 0 ? remainingQty : 0,
      };
    });
    console.log('Line drafts after selection:', drafts);
    setLineDrafts(drafts);
  };

  const updateLineDraft = (index: number, field: keyof DeliveryLineDraft, value: any) => {
    setLineDrafts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleItemSelect = (index: number, selected: boolean) => {
    setLineDrafts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected };
      // When selecting an item, automatically set delivery quantity to remaining quantity
      if (selected) {
        updated[index].deliveryQuantity = updated[index].remainingQuantity;
      } else {
        updated[index].deliveryQuantity = 0;
      }
      return updated;
    });
  };

  const handleQuantityChange = (index: number, delta: number) => {
    console.log('handleQuantityChange called:', { index, delta, currentLineDrafts: lineDrafts });
    setLineDrafts(prev => {
      const updated = [...prev];
      const currentQty = updated[index].deliveryQuantity || 0;
      const newQty = Math.max(0, Math.min(updated[index].remainingQuantity, currentQty + delta));
      console.log('Updating quantity:', { currentQty, newQty, remainingQuantity: updated[index].remainingQuantity });
      updated[index] = { ...updated[index], deliveryQuantity: newQty };
      return updated;
    });
  };

  const canGoToStep2 = () => selectedOrder !== null;
  const canGoToStep3 = () => lineDrafts.some((l) => l.selected && l.deliveryQuantity > 0);

  const nextStep = () => {
    if (wizardStep === 0 && !canGoToStep2()) {
      alert('Please select an order first');
      return;
    }
    if (wizardStep === 1 && !canGoToStep3()) {
      alert('Please select at least one item to deliver');
      return;
    }
    if (wizardStep < 2) {
      setWizardStep(wizardStep + 1);
    }
  };

  const previousStep = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrder) {
      alert('Please select an order');
      return;
    }

    const selectedItems = lineDrafts.filter((l) => l.selected && l.deliveryQuantity > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item to deliver');
      return;
    }

    if (!deliveryDate) {
      alert('Please select a delivery date');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        salesOrderId: selectedOrder.id,
        deliveryDate,
        items: selectedItems.map((l) => ({
          productId: l.productId,
          deliveredQuantity: l.deliveryQuantity,
          notes: null,
        })),
        deliveryPerson: deliveryPerson.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        notes: notes.trim() || null,
        locationId: selectedLocationId || undefined,
      };

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || 'Failed to create delivery');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('Failed to create delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDeliveryQuantity = lineDrafts
    .filter((l) => l.selected)
    .reduce((sum, l) => sum + l.deliveryQuantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Delivery</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          {/* Step Indicator */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  wizardStep >= i ? 'bg-[#014582]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {wizardStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Find Order</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search order # or customer..."
                  value={orderSearchQuery}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    searchOrders(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => {
                      setOrderSearchQuery('');
                      setOrderSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {isSearchingOrders && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-[#014582]" size={24} />
                </div>
              )}

              {orderSearchResults.length > 0 && (
                <div className="space-y-2">
                  {orderSearchResults.map((order: any) => (
                    <button
                      key={order.id}
                      onClick={() => selectOrder(order)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <span className="text-sm text-gray-500">{order.remainingItems?.length || order.items?.length || 0} items</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedOrder && (
                <div className="p-4 bg-[#014582]/10 border border-[#014582]/20 rounded-lg">
                  <p className="font-semibold text-[#014582]">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.remainingItems?.length || selectedOrder.items?.length || 0} items available for delivery</p>
                </div>
              )}
            </div>
          )}

          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Select Items</h3>
              <div className="space-y-3">
                {lineDrafts.map((line, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={(e) => handleItemSelect(index, e.target.checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{line.productName}</p>
                        <p className="text-sm text-gray-600">SKU: {line.sku} • Qty ordered: {line.orderQuantity}</p>
                        {line.selected && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-sm text-gray-600">Delivery Qty</label>
                              <div className="flex items-center mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, -1)}
                                  className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50 transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={line.remainingQuantity}
                                  value={line.deliveryQuantity || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, Math.min(line.remainingQuantity, parseInt(e.target.value) || 0));
                                    console.log('Input onChange:', { index, value, raw: e.target.value });
                                    updateLineDraft(index, 'deliveryQuantity', value);
                                  }}
                                  className="w-20 px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-0 text-center text-gray-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, 1)}
                                  className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-gray-100 rounded-lg">
                              <p className="text-xs text-gray-500">Remaining</p>
                              <p className="font-semibold text-[#014582]">{line.remainingQuantity}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {lineDrafts.some((l) => l.selected) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900">Total Items: {totalDeliveryQuantity}</p>
                </div>
              )}
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Delivery Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Person (Optional)</label>
                <input
                  type="text"
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                  placeholder="Enter delivery person name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number (Optional)</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter delivery notes"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent resize-none"
                />
              </div>

              <div className="p-4 bg-[#014582]/10 border border-[#014582]/20 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold">{totalDeliveryQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order #</span>
                  <span className="font-semibold">{selectedOrder?.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold">{selectedOrder?.customerName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {wizardStep > 0 && (
              <button
                onClick={previousStep}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1" />
            {wizardStep < 2 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-colors font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Delivery'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
