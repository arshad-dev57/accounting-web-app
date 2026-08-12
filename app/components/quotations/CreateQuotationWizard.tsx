'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Package,
  User,
  DollarSign
} from 'lucide-react';
import { QuotationLineDraft, Customer, Product } from '@/lib/types/quotation';
import TaxRateSelect from '../../../components/TaxRateSelect';

interface CreateQuotationWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateQuotationWizard({ onClose, onSuccess }: CreateQuotationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Customer Selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 2: Items
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [lineDrafts, setLineDrafts] = useState<QuotationLineDraft[]>([]);

  // Step 3: Details
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [salesPerson, setSalesPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      try {
        setIsSearchingCustomers(true);
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/customer/search?q=${encodeURIComponent(customerSearch)}&limit=10`, {
          headers,
        });
        const result = await response.json();

        if (result.success && result.data) {
          setCustomerResults(result.data.data || result.data);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setIsSearchingCustomers(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [customerSearch]);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 2) {
        setProductResults([]);
        return;
      }

      try {
        setIsSearchingProducts(true);
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/product/search?q=${encodeURIComponent(productSearch)}&limit=10`, {
          headers,
        });
        const result = await response.json();

        if (result.success && result.data) {
          setProductResults(result.data.data || result.data);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearchingProducts(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [productSearch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateLineTotal = (line: QuotationLineDraft) => {
    const subtotal = line.quantity * line.unitPrice;
    const discountAmount = subtotal * (line.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (line.taxRate / 100);
    return subtotal - discountAmount + taxAmount;
  };

  const calculateSubtotal = () => {
    return lineDrafts.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const calculateTotalDiscount = () => {
    return lineDrafts.reduce((sum, line) => {
      const subtotal = line.quantity * line.unitPrice;
      return sum + (subtotal * (line.discount / 100));
    }, 0);
  };

  const calculateTotalTax = () => {
    return lineDrafts.reduce((sum, line) => {
      const subtotal = line.quantity * line.unitPrice;
      const discountAmount = subtotal * (line.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      return sum + (taxableAmount * (line.taxRate / 100));
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount() + calculateTotalTax();
  };

  const calculateTotalItems = () => {
    return lineDrafts.reduce((sum, line) => sum + line.quantity, 0);
  };

  const canGoToStep2 = () => {
    return selectedCustomer !== null;
  };

  const canGoToStep3 = () => {
    return lineDrafts.length > 0;
  };

  const handleNextStep = () => {
    if (currentStep === 0 && !canGoToStep2()) {
      alert('Please select a customer first');
      return;
    }
    if (currentStep === 1 && !canGoToStep3()) {
      alert('Please add at least one item');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddProduct = (product: Product) => {
    const existingIndex = lineDrafts.findIndex(line => line.productId === product.id);

    if (existingIndex !== -1) {
      const updated = [...lineDrafts];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      setLineDrafts(updated);
    } else {
      const newLine: QuotationLineDraft = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        taxRate: product.taxRate || 0,
      };
      setLineDrafts([...lineDrafts, newLine]);
    }

    setProductSearch('');
    setProductResults([]);
  };

  const handleRemoveProduct = (index: number) => {
    setLineDrafts(lineDrafts.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: keyof QuotationLineDraft, value: number) => {
    const updated = [...lineDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setLineDrafts(updated);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || lineDrafts.length === 0) {
      alert('Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        customerCompany: selectedCustomer.company || '',
        quotationDate,
        validUntil,
        salesPerson: salesPerson || null,
        items: lineDrafts.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount,
          taxRate: line.taxRate,
          notes: null,
        })),
        notes: notes || null,
        termsConditions: termsConditions || null,
        status: 'Draft',
      };

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#014582] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Create Quotation</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Step 1: Select Customer</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>

              {isSearchingCustomers && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Searching...</div>
                </div>
              )}

              {customerResults.length > 0 && (
                <div className="space-y-2">
                  {customerResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch(customer.name);
                        setCustomerResults([]);
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email || customer.phone}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="p-4 bg-[#014582]/10 border border-[#014582]/30 rounded-lg">
                  <p className="font-semibold text-[#014582]">{selectedCustomer.name}</p>
                  {selectedCustomer.email && <p className="text-sm text-gray-600">{selectedCustomer.email}</p>}
                  {selectedCustomer.phone && <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>}
                  {selectedCustomer.company && <p className="text-sm text-gray-600">{selectedCustomer.company}</p>}
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Step 2: Add Items</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>

              {isSearchingProducts && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-gray-500">Searching...</div>
                </div>
              )}

              {productResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {productResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {product.sku} • {formatCurrency(product.sellingPrice)}</p>
                        </div>
                        <Plus className="w-5 h-5 text-[#014582]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lineDrafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lineDrafts.map((line, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{line.productName}</p>
                          <p className="text-sm text-gray-500">SKU: {line.sku}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleUpdateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Disc%</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discount}
                            onChange={(e) => handleUpdateLine(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tax</label>
                          <TaxRateSelect
                            value={line.taxRate}
                            onChange={(rate) => handleUpdateLine(index, 'taxRate', rate)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-2">
                        <span className="text-sm text-gray-500">Line Total: </span>
                        <span className="text-sm font-semibold text-gray-800 ml-1">
                          {formatCurrency(calculateLineTotal(line))}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Discount</span>
                      <span className="text-red-500">-{formatCurrency(calculateTotalDiscount())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-500">Tax</span>
                      <span className="text-blue-500">{formatCurrency(calculateTotalTax())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Items</span>
                      <span className="text-gray-800">{calculateTotalItems()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                      <span className="text-gray-800">Grand Total</span>
                      <span className="text-[#014582]">{formatCurrency(calculateGrandTotal())}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Step 3: Quotation Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Quotation Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={(e) => setQuotationDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Valid Until *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Sales Person (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Terms & Conditions (Optional)</label>
                <textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </div>

              <div className="p-4 bg-[#014582]/10 border border-[#014582]/30 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold text-gray-800">{selectedCustomer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-semibold text-gray-800">{calculateTotalItems()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800">Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(calculateGrandTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={handlePreviousStep}
              className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 2 ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-all font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Quotation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
