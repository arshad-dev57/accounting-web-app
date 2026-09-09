'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Search, Loader2, ClipboardList, Eye, Send, Check, X,
  Ban, Trash2, RefreshCw, ShoppingCart, AlertCircle, Edit3,
  Package, CheckCircle, Clock, ChevronLeft, ChevronRight,
  ArrowLeft, Filter, Calendar,
} from 'lucide-react';
import {
  purchaseRequisitionService,
  PurchaseRequisitionModel,
} from '../../api/purchaserequisition/route';
import { purchaseOrderService, Product, Supplier } from '../../api/purchaseorder/route';
import { useLocation } from '@/lib/location-context';
import {
  SupplierDetailCard,
  ProductDetailCard,
} from '../../components/purchases/EnterpriseDetailCards';

type LineDraft = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  estimatedUnitPrice: number;
  notes: string;
  purpose: string;
};

interface WizardState {
  step: number;
  title: string;
  department: string;
  priority: string;
  requiredDate: string;
  notes: string;
  suggestedSupplier: Supplier | null;
  supplierSearchResults: Supplier[];
  isSearchingSuppliers: boolean;
  lines: LineDraft[];
  productSearchResults: Product[];
  isSearchingProducts: boolean;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    Draft: 'bg-orange-100 text-orange-700',
    Submitted: 'bg-amber-100 text-amber-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-red-100 text-red-700',
    'Partially Converted': 'bg-blue-100 text-blue-800',
    Converted: 'bg-indigo-100 text-indigo-800',
    Cancelled: 'bg-slate-100 text-slate-600',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

function getStatusIcon(status: string) {
  if (status === 'Approved' || status === 'Converted') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'Submitted' || status === 'Partially Converted') return <Clock className="w-3.5 h-3.5" />;
  if (status === 'Rejected' || status === 'Cancelled') return <Ban className="w-3.5 h-3.5" />;
  return <ClipboardList className="w-3.5 h-3.5" />;
}

export function PurchaseRequisitionsPage() {
  const { selectedLocationId } = useLocation();
  const [rows, setRows] = useState<PurchaseRequisitionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, converted: 0 });
  const [viewing, setViewing] = useState<PurchaseRequisitionModel | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [convertSupplier, setConvertSupplier] = useState<Supplier | null>(null);
  const [convertSupplierResults, setConvertSupplierResults] = useState<Supplier[]>([]);
  const [convertForm, setConvertForm] = useState({
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: '',
    notes: '',
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    title: '',
    department: '',
    priority: 'Normal',
    requiredDate: '',
    notes: '',
    suggestedSupplier: null,
    supplierSearchResults: [],
    isSearchingSuppliers: false,
    lines: [],
    productSearchResults: [],
    isSearchingProducts: false,
  });

  const estimatedTotal = wizardState.lines.reduce(
    (sum, l) => sum + l.quantity * l.estimatedUnitPrice,
    0
  );
  const canGoToStep2 = true;
  const canGoToStep3 = wizardState.lines.length > 0;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [list, st] = await Promise.all([
        purchaseRequisitionService.getRequisitions({
          page: 1,
          limit: 50,
          search: searchTerm || undefined,
          status: selectedFilter === 'all' ? undefined : selectedFilter,
          locationId: selectedLocationId || undefined,
        }),
        purchaseRequisitionService.getStats(selectedLocationId || undefined),
      ]);
      setRows(list.data);
      setStats(st);
    } catch (e: any) {
      setError(e.message || 'Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFilter, selectedLocationId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetWizard = () => {
    setWizardState({
      step: 0,
      title: '',
      department: '',
      priority: 'Normal',
      requiredDate: '',
      notes: '',
      suggestedSupplier: null,
      supplierSearchResults: [],
      isSearchingSuppliers: false,
      lines: [],
      productSearchResults: [],
      isSearchingProducts: false,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetWizard();
    setShowWizard(true);
  };

  const openEdit = (row: PurchaseRequisitionModel) => {
    setEditingId(row.id);
    setViewing(null);
    setWizardState({
      step: 0,
      title: row.title || '',
      department: row.department || '',
      priority: row.priority || 'Normal',
      requiredDate: row.requiredDate ? row.requiredDate.slice(0, 10) : '',
      notes: row.notes || '',
      suggestedSupplier: row.suggestedSupplierId
        ? ({
            id: row.suggestedSupplierId,
            name: row.suggestedSupplierName || '',
            isActive: true,
          } as Supplier)
        : null,
      supplierSearchResults: [],
      isSearchingSuppliers: false,
      lines: row.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        estimatedUnitPrice: item.estimatedUnitPrice,
        notes: item.notes || '',
        purpose: item.purpose || '',
      })),
      productSearchResults: [],
      isSearchingProducts: false,
    });
    setShowWizard(true);
  };

  const searchSuppliers = async (q: string) => {
    setWizardState((p) => ({ ...p, isSearchingSuppliers: true }));
    try {
      const results = await purchaseOrderService.searchSuppliers(q);
      setWizardState((p) => ({ ...p, supplierSearchResults: results, isSearchingSuppliers: false }));
    } catch {
      setWizardState((p) => ({ ...p, isSearchingSuppliers: false }));
    }
  };

  const searchProducts = async (q: string) => {
    setWizardState((p) => ({ ...p, isSearchingProducts: true }));
    try {
      const results = await purchaseOrderService.searchProducts(q, 15, selectedLocationId || undefined);
      setWizardState((p) => ({ ...p, productSearchResults: results, isSearchingProducts: false }));
    } catch {
      setWizardState((p) => ({ ...p, isSearchingProducts: false }));
    }
  };

  const addProduct = (product: Product) => {
    setWizardState((p) => {
      if (p.lines.some((l) => l.productId === product.id)) {
        return { ...p, productSearchResults: [] };
      }
      return {
        ...p,
        productSearchResults: [],
        lines: [
          ...p.lines,
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            estimatedUnitPrice: product.costPrice || 0,
            notes: '',
            purpose: '',
          },
        ],
      };
    });
  };

  const saveRequisition = async () => {
    if (!wizardState.lines.length) {
      setError('Add at least one item');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        title: wizardState.title,
        department: wizardState.department,
        priority: wizardState.priority,
        requiredDate: wizardState.requiredDate || undefined,
        suggestedSupplierId: wizardState.suggestedSupplier?.id,
        notes: wizardState.notes,
        locationId: selectedLocationId || undefined,
        items: wizardState.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          estimatedUnitPrice: l.estimatedUnitPrice,
          notes: l.notes,
          purpose: l.purpose,
        })),
      };
      if (editingId) {
        await purchaseRequisitionService.update(editingId, payload);
        setSuccess('Requisition updated');
      } else {
        await purchaseRequisitionService.create(payload);
        setSuccess('Requisition created as draft');
      }
      setShowWizard(false);
      resetWizard();
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to save requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (action: string, row: PurchaseRequisitionModel) => {
    try {
      setSubmitting(true);
      setError('');
      if (action === 'submit') await purchaseRequisitionService.submit(row.id);
      if (action === 'approve') await purchaseRequisitionService.approve(row.id);
      if (action === 'reject') {
        const reason = window.prompt('Rejection reason') || 'Rejected';
        await purchaseRequisitionService.reject(row.id, reason);
      }
      if (action === 'cancel') await purchaseRequisitionService.cancel(row.id);
      if (action === 'delete') {
        if (!window.confirm('Delete this requisition?')) return;
        await purchaseRequisitionService.delete(row.id);
        setViewing(null);
      }
      setSuccess(`Requisition ${action}ed successfully`);
      await load();
      if (viewing?.id === row.id && action !== 'delete') {
        setViewing(await purchaseRequisitionService.getById(row.id));
      }
    } catch (e: any) {
      setError(e.message || `Failed to ${action}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openConvert = async (row: PurchaseRequisitionModel) => {
    setViewing(row);
    setConvertSupplier(
      row.suggestedSupplierId
        ? ({
            id: row.suggestedSupplierId,
            name: row.suggestedSupplierName || '',
            isActive: true,
          } as Supplier)
        : null
    );
    setConvertForm({
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: row.requiredDate ? row.requiredDate.slice(0, 10) : '',
      notes: `Converted from ${row.requisitionNumber}`,
    });
    setShowConvert(true);
  };

  const convertToPO = async () => {
    if (!viewing) return;
    if (!convertSupplier?.id) {
      setError('Select a supplier for the purchase order');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const po = await purchaseRequisitionService.convertToPO(viewing.id, {
        supplierId: convertSupplier.id,
        orderDate: convertForm.orderDate,
        expectedDeliveryDate: convertForm.expectedDeliveryDate || undefined,
        notes: convertForm.notes,
        locationId: selectedLocationId || undefined,
        status: 'Draft',
      });
      setSuccess(`Purchase order ${po.orderNumber || ''} created from requisition`);
      setShowConvert(false);
      await load();
      setViewing(await purchaseRequisitionService.getById(viewing.id));
    } catch (e: any) {
      setError(e.message || 'Failed to convert');
    } finally {
      setSubmitting(false);
    }
  };

  if (showWizard) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowWizard(false);
                resetWizard();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              {editingId ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
            </h2>
          </div>
        </div>

        {(error || success) && (
          <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error || success}</span>
            <button className="ml-auto" onClick={() => { setError(''); setSuccess(''); }}><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {[0, 1, 2].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center gap-1 md:gap-2 ${wizardState.step >= step ? 'text-[#014582]' : 'text-gray-300'}`}>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 ${
                  wizardState.step >= step ? 'border-[#014582] bg-[#014582]/10' : 'border-gray-300'
                }`}>
                  {step + 1}
                </div>
                <span className="text-[10px] md:text-sm font-medium hidden sm:inline">
                  {step === 0 ? 'Details' : step === 1 ? 'Items' : 'Review'}
                </span>
              </div>
              {step < 2 && (
                <div className={`flex-1 h-0.5 mx-1 md:mx-2 ${wizardState.step > step ? 'bg-[#014582]' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6">
          {wizardState.step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-bold text-gray-700">Requisition Details</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Title *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                    value={wizardState.title}
                    onChange={(e) => setWizardState((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Warehouse restock – September"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Department</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                    value={wizardState.department}
                    onChange={(e) => setWizardState((p) => ({ ...p, department: e.target.value }))}
                    placeholder="Operations / Admin / Production"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Priority</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                    value={wizardState.priority}
                    onChange={(e) => setWizardState((p) => ({ ...p, priority: e.target.value }))}
                  >
                    {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Required by</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                    value={wizardState.requiredDate}
                    onChange={(e) => setWizardState((p) => ({ ...p, requiredDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Suggested supplier (optional)</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                    placeholder="Search supplier by name, phone, email..."
                    onChange={(e) => searchSuppliers(e.target.value)}
                  />
                </div>
                {wizardState.isSearchingSuppliers && (
                  <div className="mt-3 p-4"><Loader2 className="w-5 h-5 mx-auto animate-spin text-[#014582]" /></div>
                )}
                {wizardState.supplierSearchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                    {wizardState.supplierSearchResults.map((s) => (
                      <SupplierDetailCard
                        key={s.id}
                        supplier={s}
                        onClick={() =>
                          setWizardState((p) => ({
                            ...p,
                            suggestedSupplier: s,
                            supplierSearchResults: [],
                          }))
                        }
                      />
                    ))}
                  </div>
                )}
                {wizardState.suggestedSupplier && (
                  <div className="mt-3">
                    <SupplierDetailCard
                      supplier={wizardState.suggestedSupplier}
                      selected
                      onClear={() => setWizardState((p) => ({ ...p, suggestedSupplier: null }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Notes / justification</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#014582] outline-none resize-none"
                  value={wizardState.notes}
                  onChange={(e) => setWizardState((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Why is this purchase needed?"
                />
              </div>
            </div>
          )}

          {wizardState.step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-bold text-gray-700">Add Requested Items</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                  placeholder="Search products by name or SKU..."
                  onChange={(e) => searchProducts(e.target.value)}
                />
              </div>
              {wizardState.isSearchingProducts && (
                <div className="p-4"><Loader2 className="w-5 h-5 mx-auto animate-spin text-[#014582]" /></div>
              )}
              {wizardState.productSearchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                  {wizardState.productSearchResults.map((p) => (
                    <ProductDetailCard
                      key={p.id}
                      product={p}
                      formatCurrency={formatMoney}
                      onClick={() => addProduct(p)}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {wizardState.lines.map((line, idx) => (
                  <div key={line.productId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{line.productName}</p>
                        <p className="text-xs text-gray-400">SKU: {line.sku}</p>
                      </div>
                      <button
                        onClick={() =>
                          setWizardState((p) => ({
                            ...p,
                            lines: p.lines.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <div>
                        <label className="text-[10px] text-gray-500">Quantity</label>
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          className="w-full rounded border px-2 py-1.5 text-sm"
                          value={line.quantity}
                          onChange={(e) =>
                            setWizardState((p) => ({
                              ...p,
                              lines: p.lines.map((l, i) =>
                                i === idx ? { ...l, quantity: Number(e.target.value) } : l
                              ),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Est. unit price</label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className="w-full rounded border px-2 py-1.5 text-sm"
                          value={line.estimatedUnitPrice}
                          onChange={(e) =>
                            setWizardState((p) => ({
                              ...p,
                              lines: p.lines.map((l, i) =>
                                i === idx ? { ...l, estimatedUnitPrice: Number(e.target.value) } : l
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500">Purpose / notes</label>
                        <input
                          className="w-full rounded border px-2 py-1.5 text-sm"
                          value={line.purpose || line.notes}
                          onChange={(e) =>
                            setWizardState((p) => ({
                              ...p,
                              lines: p.lines.map((l, i) =>
                                i === idx
                                  ? { ...l, purpose: e.target.value, notes: e.target.value }
                                  : l
                              ),
                            }))
                          }
                          placeholder="Why needed / usage"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-right text-[#014582] font-semibold mt-2">
                      Line est. {formatMoney(line.quantity * line.estimatedUnitPrice)}
                    </p>
                  </div>
                ))}
              </div>

              {wizardState.lines.length > 0 && (
                <div className="p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Estimated total</span>
                  <span className="text-sm font-bold text-[#014582]">{formatMoney(estimatedTotal)}</span>
                </div>
              )}
            </div>
          )}

          {wizardState.step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-bold text-gray-700">Review & Save</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Title</p>
                  <p className="font-semibold">{wizardState.title || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Department</p>
                  <p className="font-semibold">{wizardState.department || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Priority</p>
                  <p className="font-semibold">{wizardState.priority}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Required by</p>
                  <p className="font-semibold">{formatDate(wizardState.requiredDate)}</p>
                </div>
              </div>
              {wizardState.suggestedSupplier && (
                <SupplierDetailCard supplier={wizardState.suggestedSupplier} selected />
              )}
              <div className="border rounded-lg divide-y">
                {wizardState.lines.map((l) => (
                  <div key={l.productId} className="px-3 py-2 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{l.productName}</p>
                      <p className="text-xs text-gray-400">
                        {l.sku} · Qty {l.quantity} · {formatMoney(l.estimatedUnitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatMoney(l.quantity * l.estimatedUnitPrice)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-[#014582]">
                <span>Estimated total</span>
                <span>{formatMoney(estimatedTotal)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setWizardState((p) => ({ ...p, step: Math.max(0, p.step - 1) }))}
            disabled={wizardState.step === 0}
            className="px-4 md:px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowWizard(false);
                resetWizard();
              }}
              className="px-4 md:px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            {wizardState.step < 2 ? (
              <button
                onClick={() => {
                  if (wizardState.step === 1 && !canGoToStep3) {
                    alert('Add at least one item');
                    return;
                  }
                  setWizardState((p) => ({ ...p, step: p.step + 1 }));
                }}
                disabled={wizardState.step === 0 && !canGoToStep2}
                className="px-5 md:px-7 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={saveRequisition}
                disabled={submitting || wizardState.lines.length === 0}
                className="px-5 md:px-7 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Save Changes' : 'Create Draft'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#014582]" />
            Purchase Requisitions
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Request → Approve → Convert to Purchase Order
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#014582] px-4 py-2.5 text-white text-sm font-semibold hover:bg-[#01366a] shadow-lg shadow-[#014582]/20"
        >
          <Plus className="w-4 h-4" /> New Requisition
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error || success}</span>
          <button className="ml-auto" onClick={() => { setError(''); setSuccess(''); }}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Total', stats.total, 'bg-slate-50'],
          ['Draft', stats.draft, 'bg-orange-50'],
          ['Submitted', stats.submitted, 'bg-amber-50'],
          ['Approved', stats.approved, 'bg-emerald-50'],
          ['Converted', stats.converted, 'bg-indigo-50'],
        ].map(([label, value, bg]) => (
          <div key={String(label)} className={`rounded-xl border border-gray-100 ${bg} p-3 md:p-4`}>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PR number, title, department, supplier..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none bg-gray-50"
            />
          </div>
          <button onClick={load} className="px-3 py-2 border border-gray-200 rounded-lg text-sm inline-flex items-center gap-2 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {['all', 'Draft', 'Submitted', 'Approved', 'Rejected', 'Partially Converted', 'Converted', 'Cancelled'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${
                selectedFilter === filter ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">PR #</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Priority</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Est. Total</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 className="w-7 h-7 mx-auto text-[#014582] animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-gray-500">No requisitions found</p>
                    <p className="text-xs">Create a requisition to start purchasing</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-2 md:py-3 font-medium text-[#014582]">{row.requisitionNumber}</td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <p className="font-medium text-gray-800">{row.title || '—'}</p>
                      <p className="text-[10px] text-gray-400">{row.department || 'No dept'} · {row.totalItems} items</p>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">{row.priority}</td>
                    <td className="px-3 md:px-6 py-2 md:py-3 font-semibold">{formatMoney(row.estimatedTotal)}</td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(row.status)}`}>
                        {getStatusIcon(row.status)} {row.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewing(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {row.canEdit && (
                          <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {row.canSubmit && (
                          <button onClick={() => runAction('submit', row)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Submit">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {row.canApprove && (
                          <button onClick={() => runAction('approve', row)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {row.canConvert && (
                          <button onClick={() => openConvert(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Convert to PO">
                            <ShoppingCart className="w-4 h-4" />
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
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between px-4 md:px-6 py-4 border-b bg-gradient-to-r from-[#014582]/5 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-[#014582]/10 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#014582]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{viewing.requisitionNumber}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${getStatusColor(viewing.status)}`}>
                      {getStatusIcon(viewing.status)} {viewing.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(viewing.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Title</p><p className="font-semibold">{viewing.title || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Department</p><p className="font-semibold">{viewing.department || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Priority</p><p className="font-semibold">{viewing.priority}</p></div>
                <div><p className="text-xs text-gray-400">Required by</p><p className="font-semibold">{formatDate(viewing.requiredDate)}</p></div>
                <div><p className="text-xs text-gray-400">Estimated total</p><p className="font-semibold text-[#014582]">{formatMoney(viewing.estimatedTotal)}</p></div>
                <div><p className="text-xs text-gray-400">Items</p><p className="font-semibold">{viewing.totalItems}</p></div>
              </div>

              {viewing.suggestedSupplierName && (
                <SupplierDetailCard
                  supplier={{
                    id: viewing.suggestedSupplierId,
                    name: viewing.suggestedSupplierName,
                  }}
                  selected
                />
              )}

              {viewing.notes && (
                <div>
                  <p className="text-xs text-gray-400">Notes</p>
                  <p className="text-sm text-gray-700 mt-1">{viewing.notes}</p>
                </div>
              )}
              {viewing.rejectionReason && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">Rejected: {viewing.rejectionReason}</div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Line items</p>
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {viewing.items.map((item, idx) => (
                    <div key={item.id || idx} className="px-3 py-2.5 text-sm">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-800">{item.productName}</p>
                          <p className="text-xs text-gray-400">
                            SKU {item.sku} · Qty {item.quantity} · {formatMoney(item.estimatedUnitPrice)} ea
                          </p>
                          {(item.purpose || item.notes) && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.purpose || item.notes}</p>
                          )}
                        </div>
                        <p className="font-semibold">{formatMoney(item.quantity * item.estimatedUnitPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!!viewing.purchaseOrders?.length && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Linked purchase orders</p>
                  <div className="space-y-1">
                    {viewing.purchaseOrders.map((po) => (
                      <div key={po.id} className="text-sm flex justify-between rounded border px-3 py-2">
                        <span className="text-[#014582] font-medium">{po.orderNumber}</span>
                        <span className="text-gray-500">{po.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 md:px-6 py-3 border-t flex flex-wrap gap-2 bg-gray-50">
              {viewing.canEdit && (
                <button onClick={() => openEdit(viewing)} className="px-4 py-2 rounded-lg border text-sm inline-flex items-center gap-1.5 bg-white">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {viewing.canSubmit && (
                <button onClick={() => runAction('submit', viewing)} disabled={submitting} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm inline-flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Submit
                </button>
              )}
              {viewing.canApprove && (
                <button onClick={() => runAction('approve', viewing)} disabled={submitting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              {viewing.canReject && (
                <button onClick={() => runAction('reject', viewing)} disabled={submitting} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm bg-white">Reject</button>
              )}
              {viewing.canConvert && (
                <button onClick={() => openConvert(viewing)} className="px-4 py-2 rounded-lg bg-[#014582] text-white text-sm inline-flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Convert to PO
                </button>
              )}
              {viewing.canCancel && (
                <button onClick={() => runAction('cancel', viewing)} disabled={submitting} className="px-4 py-2 rounded-lg border text-sm bg-white inline-flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showConvert && viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Convert {viewing.requisitionNumber} → PO</h3>
              <button onClick={() => setShowConvert(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500">Creates a draft purchase order linked to this requisition with full line details.</p>
            <div>
              <label className="text-xs font-semibold text-gray-600">Supplier *</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Search supplier..."
                onChange={async (e) => {
                  const results = await purchaseOrderService.searchSuppliers(e.target.value);
                  setConvertSupplierResults(results);
                }}
              />
              {convertSupplierResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {convertSupplierResults.map((s) => (
                    <SupplierDetailCard
                      key={s.id}
                      supplier={s}
                      onClick={() => {
                        setConvertSupplier(s);
                        setConvertSupplierResults([]);
                      }}
                    />
                  ))}
                </div>
              )}
              {convertSupplier && (
                <div className="mt-2">
                  <SupplierDetailCard
                    supplier={convertSupplier}
                    selected
                    onClear={() => setConvertSupplier(null)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Order date</label>
                <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={convertForm.orderDate} onChange={(e) => setConvertForm((p) => ({ ...p, orderDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Expected delivery</label>
                <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={convertForm.expectedDeliveryDate} onChange={(e) => setConvertForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Notes</label>
              <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={convertForm.notes} onChange={(e) => setConvertForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConvert(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button disabled={submitting || !convertSupplier} onClick={convertToPO} className="px-4 py-2 rounded-lg bg-[#014582] text-white text-sm disabled:opacity-50 inline-flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModuleRoutePlaceholder() {
  return null;
}
