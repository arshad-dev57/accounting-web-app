'use client';

import {
  X,
  ChevronRight,
  Search,
  Loader2,
  Building2,
  Package,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Truck,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { GRNSource, POSource, PurchaseInvoiceLineDraft } from '../../api/purchaseinvoice/route';
import TaxRateSelect from '../../../components/TaxRateSelect';

type InvoiceSource = GRNSource | POSource;

interface CreateInvoiceWizardProps {
  wizardState: {
    step: number;
    sourceType: 'grn' | 'po';
    selectedSource: InvoiceSource | null;
    sourceSearchResults: InvoiceSource[];
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
  selectSource: (source: InvoiceSource) => void;
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

function sourceDocNumber(source: InvoiceSource, sourceType: 'grn' | 'po') {
  return sourceType === 'grn'
    ? (source as GRNSource).grnNumber
    : (source as POSource).orderNumber;
}

function sourceDateValue(source: InvoiceSource, sourceType: 'grn' | 'po') {
  return sourceType === 'grn'
    ? (source as GRNSource).receivingDate
    : (source as POSource).orderDate;
}

function sourceAmount(source: InvoiceSource) {
  if (typeof source.grandTotal === 'number') return source.grandTotal;
  if (typeof source.invoiceSubtotal === 'number') return source.invoiceSubtotal;
  return (source.items || []).reduce((sum, item: any) => {
    const qty = Number(item.quantity ?? item.receivingQuantity ?? 0);
    const price = Number(item.unitPrice ?? 0);
    const discount = Number(item.discount ?? 0);
    const tax = Number(item.taxRate ?? 0);
    return sum + qty * price * (1 - discount / 100) * (1 + tax / 100);
  }, 0);
}

function sourceItemCount(source: InvoiceSource) {
  return source.itemCount ?? source.items?.length ?? 0;
}

function sourceQty(source: InvoiceSource) {
  if (typeof source.totalQuantity === 'number') return source.totalQuantity;
  return (source.items || []).reduce(
    (sum, item: any) => sum + Number(item.quantity ?? item.receivingQuantity ?? 0),
    0
  );
}

function sourceItemPreview(source: InvoiceSource) {
  if (source.itemPreview) return source.itemPreview;
  return (source.items || [])
    .slice(0, 3)
    .map((item: any) => item.productName)
    .filter(Boolean)
    .join(', ');
}

function MetaChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-700">
      <Icon className="w-3 h-3 text-gray-500" />
      {label}
    </span>
  );
}

function SourceDetailCard({
  source,
  sourceType,
  selected,
  onClick,
  formatCurrency,
  formatDate
}: {
  source: InvoiceSource;
  sourceType: 'grn' | 'po';
  selected?: boolean;
  onClick?: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}) {
  const isGrn = sourceType === 'grn';
  const grn = source as GRNSource;
  const po = source as POSource;
  const docNo = sourceDocNumber(source, sourceType);
  const dateValue = sourceDateValue(source, sourceType);
  const amount = sourceAmount(source);
  const itemCount = sourceItemCount(source);
  const qty = sourceQty(source);
  const preview = sourceItemPreview(source);
  const contact = [source.supplierPhone, source.supplierEmail].filter(Boolean).join(' · ');
  const locationLabel = source.locationName
    ? source.locationCode
      ? `${source.locationName} (${source.locationCode})`
      : source.locationName
    : '';
  const expectedDate = !isGrn && po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '';
  const poNumber = isGrn ? grn.purchaseOrderNumber : undefined;

  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-[#014582]/8 border-[#014582]/40'
          : 'border-gray-200 hover:bg-gray-50 hover:border-[#014582]/30 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isGrn ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {isGrn ? <Package className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{docNo}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isGrn ? 'Goods Receiving Note' : 'Purchase Order'}
                {poNumber ? ` · ${poNumber}` : ''}
                {source.status ? ` · ${source.status}` : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-[#014582] text-sm md:text-base">{formatCurrency(amount)}</p>
              <p className="text-[10px] text-gray-400">Invoice amount</p>
            </div>
          </div>

          <div className="mt-2 flex items-start gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {source.supplierName || 'Unknown supplier'}
              </p>
              {contact ? (
                <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                  {source.supplierPhone ? <Phone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                  {contact}
                </p>
              ) : null}
              {source.supplierAddress ? (
                <p className="text-[11px] text-gray-400 truncate">{source.supplierAddress}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {dateValue ? <MetaChip icon={Calendar} label={formatDate(dateValue)} /> : null}
            {expectedDate ? <MetaChip icon={Truck} label={`Due ${expectedDate}`} /> : null}
            {locationLabel ? <MetaChip icon={MapPin} label={locationLabel} /> : null}
            <MetaChip icon={Package} label={`${itemCount} item${itemCount === 1 ? '' : 's'}`} />
            {qty > 0 ? <MetaChip icon={ClipboardList} label={`Qty ${qty}`} /> : null}
            {source.hasReceivedItems ? <MetaChip icon={CheckCircle2} label="Goods received" /> : null}
          </div>

          {(source.items || []).length > 0 ? (
            <div className="mt-2.5 border-t border-gray-100 pt-2 space-y-1">
              {(source.items || []).slice(0, 4).map((item: any, idx: number) => {
                const qty = Number(item.quantity ?? item.receivingQuantity ?? 0);
                const price = Number(item.unitPrice ?? 0);
                return (
                  <div key={idx} className="flex justify-between gap-2 text-[11px] text-gray-600">
                    <span className="truncate">{item.productName || 'Item'}</span>
                    <span className="flex-shrink-0 tabular-nums">
                      {qty} × {formatCurrency(price)}
                    </span>
                  </div>
                );
              })}
              {itemCount > 4 ? (
                <p className="text-[11px] text-gray-400">+{itemCount - 4} more items</p>
              ) : null}
            </div>
          ) : preview ? (
            <p className="mt-2 text-[11px] text-gray-500 line-clamp-2">
              {preview}
              {itemCount > 3 ? '…' : ''}
            </p>
          ) : null}

          {source.hasInvoice ? (
            <p className="mt-2 text-[11px] font-semibold text-orange-700">
              {source.invoiceCount || 1} invoice(s) already exist for this {isGrn ? 'GRN' : 'PO'}
            </p>
          ) : null}
        </div>

        {!selected && <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />}
      </div>
    </div>
  );
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

  const selectedPoNumber =
    wizardState.sourceType === 'grn'
      ? (wizardState.selectedSource as GRNSource | null)?.purchaseOrderNumber
      : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Create Purchase Invoice</h2>
            <button onClick={closeCreateWizard} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  wizardState.step >= i ? 'bg-[#014582]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {wizardState.step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Source</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Search GRN or PO by number or supplier to confirm who you are invoicing.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType('grn')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    wizardState.sourceType === 'grn'
                      ? 'bg-[#014582] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Goods Receiving Note
                </button>
                <button
                  onClick={() => setSourceType('po')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    wizardState.sourceType === 'po'
                      ? 'bg-[#014582] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Purchase Order
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${wizardState.sourceType === 'grn' ? 'GRN' : 'PO'} # or supplier...`}
                  onChange={(e) => searchSource(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                />
                {wizardState.isSearchingSource && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#014582] animate-spin" />
                )}
              </div>

              <div className="space-y-2 max-h-[22rem] overflow-y-auto">
                {wizardState.sourceSearchResults.map((source) => (
                  <SourceDetailCard
                    key={source.id}
                    source={source}
                    sourceType={wizardState.sourceType}
                    onClick={() => selectSource(source)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
                {!wizardState.isSearchingSource && wizardState.sourceSearchResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {wizardState.sourceType === 'grn'
                      ? 'No GRNs found. Search by GRN number, PO number, or supplier.'
                      : 'No purchase orders found. Search by PO number or supplier.'}
                  </p>
                ) : null}
              </div>

              {wizardState.selectedSource && (
                <div>
                  <p className="text-xs font-semibold text-[#014582] mb-2">Selected for invoicing</p>
                  <SourceDetailCard
                    source={wizardState.selectedSource}
                    sourceType={wizardState.sourceType}
                    selected
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                </div>
              )}
            </div>
          )}

          {wizardState.step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Review Items</h3>

              {wizardState.selectedSource && (
                <SourceDetailCard
                  source={wizardState.selectedSource}
                  sourceType={wizardState.sourceType}
                  selected
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}

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
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#014582] text-sm"
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
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#014582] text-sm"
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
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#014582] text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Tax</label>
                        <TaxRateSelect
                          value={line.taxRate}
                          onChange={(rate) => updateLineDraft(index, 'taxRate', rate)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#014582] text-sm"
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
                    <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {wizardState.step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 3: Invoice Details</h3>

              {wizardState.selectedSource && (
                <SourceDetailCard
                  source={wizardState.selectedSource}
                  sourceType={wizardState.sourceType}
                  selected
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    value={wizardState.supplierInvoiceNo}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, supplierInvoiceNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={wizardState.paymentTerms}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={wizardState.dueDate}
                    onChange={(e) => setWizardState((prev: any) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={wizardState.notes}
                  onChange={(e) => setWizardState((prev: any) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582]"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="p-4 bg-[#014582]/10 rounded-lg space-y-2">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-gray-600">Supplier</span>
                  <span className="font-semibold text-right">{wizardState.selectedSource?.supplierName || ''}</span>
                </div>
                {wizardState.selectedSource?.supplierPhone ? (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium text-right">{wizardState.selectedSource.supplierPhone}</span>
                  </div>
                ) : null}
                {wizardState.selectedSource?.supplierEmail ? (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-right">{wizardState.selectedSource.supplierEmail}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-gray-600">Source</span>
                  <span className="font-semibold text-right">
                    {wizardState.selectedSource
                      ? sourceDocNumber(wizardState.selectedSource, wizardState.sourceType)
                      : ''}
                  </span>
                </div>
                {selectedPoNumber ? (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-gray-600">Purchase Order</span>
                    <span className="font-semibold text-right">{selectedPoNumber}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

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
              className="px-4 md:px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6b4dff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateInvoice}
              disabled={submitting || !canGoToStep3}
              className="px-4 md:px-6 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6b4dff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
