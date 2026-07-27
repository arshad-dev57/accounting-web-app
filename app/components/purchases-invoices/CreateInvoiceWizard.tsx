'use client';

import { X, ChevronRight, Search, Loader2 } from 'lucide-react';
import { GRNSource, POSource, PurchaseInvoiceLineDraft } from '../../api/purchaseinvoice/route';

interface CreateInvoiceWizardProps {
  wizardState: {
    step: number;
    sourceType: 'grn' | 'po';
    selectedSource: GRNSource | POSource | null;
    sourceSearchResults: (GRNSource | POSource)[];
    isSearchingSource: boolean;
    lineDrafts: PurchaseInvoiceLineDraft[];
    supplierInvoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    paymentTerms: string;
    notes: string;
  };
  setWizardState: (state: any) => void;
  setSourceType: (type: 'grn' | 'po') => void;
  searchSource: (query: string) => void;
  selectSource: (source: GRNSource | POSource) => void;
  nextStep: () => void;
  previousStep: () => void;
  handleCreateInvoice: () => void;
  closeCreateWizard: () => void;
  submitting: boolean;
  canGoToStep2: boolean;
  canGoToStep3: boolean;
  selectedSubtotal: number;
  selectedTotalDiscount: number;
  selectedTotalTax: number;
  selectedGrandTotal: number;
  totalItems: number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export default function CreateInvoiceWizard({
  wizardState,
  setWizardState,
  setSourceType,
  searchSource,
  selectSource,
  nextStep,
  previousStep,
  handleCreateInvoice,
  closeCreateWizard,
  submitting,
  canGoToStep2,
  canGoToStep3,
  selectedSubtotal,
  selectedTotalDiscount,
  selectedTotalTax,
  selectedGrandTotal,
  totalItems,
  formatCurrency,
  formatDate
}: CreateInvoiceWizardProps) {
  const updateLineDraft = (index: number, field: keyof PurchaseInvoiceLineDraft, value: number | string) => {
    setWizardState((prev: any) => {
      const updated = [...prev.lineDrafts];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate line totals
      const line = updated[index];
      const subtotal = line.quantity * line.unitPrice;
      const discountAmount = subtotal * (line.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (line.taxRate / 100);
      const lineTotal = taxableAmount + taxAmount;
      
      updated[index] = { ...line, subtotal, discountAmount, taxableAmount, taxAmount, lineTotal };
      
      return { ...prev, lineDrafts: updated };
    });
  };

  const removeLineDraft = (index: number) => {
    setWizardState((prev: any) => ({
      ...prev,
      lineDrafts: prev.lineDrafts.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Create Purchase Invoice</h2>
            <button onClick={closeCreateWizard} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          {/* Progress Steps */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  wizardState.step >= i ? 'bg-[#7c4dff]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Step 1: Select Source */}
          {wizardState.step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Source</h3>
              
              {/* Source Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType('grn')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    wizardState.sourceType === 'grn'
                      ? 'bg-[#7c4dff] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Goods Receiving Note
                </button>
                <button
                  onClick={() => setSourceType('po')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    wizardState.sourceType === 'po'
                      ? 'bg-[#7c4dff] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Purchase Order
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${wizardState.sourceType === 'grn' ? 'GRN' : 'PO'} # or supplier...`}
                  onChange={(e) => searchSource(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                />
                {wizardState.isSearchingSource && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c4dff] animate-spin" />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wizardState.sourceSearchResults.map((source: any) => (
                  <div
                    key={source.id}
                    onClick={() => selectSource(source)}
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">
                        {wizardState.sourceType === 'grn' ? source.grnNumber : source.orderNumber}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {source.supplierName} • {source.items?.length || 0} items
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  </div>
                ))}
              </div>

              {/* Selected Source */}
              {wizardState.selectedSource && (
                <div className="p-4 bg-[#7c4dff]/10 border border-[#7c4dff]/30 rounded-lg">
                  <p className="font-semibold text-[#7c4dff] text-sm md:text-base">
                    {wizardState.sourceType === 'grn' 
                      ? (wizardState.selectedSource as GRNSource).grnNumber
                      : (wizardState.selectedSource as POSource).orderNumber}
                  </p>
                  <p className="text-gray-700 text-sm md:text-base">{wizardState.selectedSource.supplierName}</p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {wizardState.selectedSource.items?.length || 0} items ready for invoicing
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review Items */}
          {wizardState.step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Review Items</h3>
              
              <div className="space-y-3">
                {wizardState.lineDrafts.map((line, index) => (
                  <div key={index} className="p-3 md:p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{line.productName}</p>
                        <p className="text-xs text-gray-500">SKU: {line.sku}</p>
                      </div>
                      <button
                        onClick={() => removeLineDraft(index)}
                        className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Qty</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLineDraft(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#7c4dff] text-sm"
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
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#7c4dff] text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Disc%</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={line.discount}
                          onChange={(e) => updateLineDraft(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#7c4dff] text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Tax%</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={line.taxRate}
                          onChange={(e) => updateLineDraft(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#7c4dff] text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-xs text-gray-500">Line Total: </span>
                      <span className="font-semibold text-sm md:text-base">{formatCurrency(line.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {wizardState.lineDrafts.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(selectedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTotalDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedTotalTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Grand Total</span>
                    <span className="text-[#7c4dff]">{formatCurrency(selectedGrandTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Invoice Details */}
          {wizardState.step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Invoice Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    value={wizardState.supplierInvoiceNo}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, supplierInvoiceNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={wizardState.paymentTerms}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={wizardState.invoiceDate}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={wizardState.dueDate}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={wizardState.notes}
                  onChange={(e) => setWizardState((prev: any) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="p-4 bg-[#7c4dff]/10 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Supplier</span>
                  <span className="font-semibold">{wizardState.selectedSource?.supplierName || ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Source</span>
                  <span className="font-semibold">
                    {wizardState.sourceType === 'grn' 
                      ? (wizardState.selectedSource as GRNSource)?.grnNumber
                      : (wizardState.selectedSource as POSource)?.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span className="text-[#7c4dff]">{formatCurrency(selectedGrandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200 flex items-center justify-between">
          {wizardState.step > 0 && (
            <button
              onClick={previousStep}
              className="px-4 md:px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {wizardState.step < 2 ? (
            <button
              onClick={nextStep}
              disabled={!canGoToStep2 && wizardState.step === 0}
              className="px-4 md:px-6 py-2 bg-[#7c4dff] text-white rounded-lg hover:bg-[#6b4dff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateInvoice}
              disabled={submitting || !canGoToStep3}
              className="px-4 md:px-6 py-2 bg-[#7c4dff] text-white rounded-lg hover:bg-[#6b4dff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
