'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Search,
  Filter,
  Eye,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Boxes,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradeDetailDrawer,
  TradeModal,
} from '../../../components/trade/TradeUI';
import importApi, { ImportGrn, ImportLandedCost } from '../../../lib/import-api';
import { useCurrency } from '../../../lib/currency-context';
import { formatImportMoney } from '../../../lib/import-format';
import { FormSection, FieldLabel } from '@/components/import/ImportSelectors';

function lcaLabel(item: ImportLandedCost) {
  return item.allocationNumber || item.lcaNumber || '—';
}
function lcaGrnRef(item: ImportLandedCost) {
  return item.grnRef || item.grnId || item.importGrnId || '—';
}
function lcaPoRef(item: ImportLandedCost) {
  return item.poRef || item.importPoId || '—';
}
function lcaPosted(item: ImportLandedCost) {
  return Boolean(item.isPosted || item.status === 'Posted');
}
function lcaFinalTotal(item: ImportLandedCost) {
  return Number(item.totalFinalLandedCostUsd ?? item.totalLandedCostUsd ?? 0);
}

export default function LandedCostsPage() {
  const { code: baseCurrencyCode } = useCurrency();

  const [items, setItems] = useState<ImportLandedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAllocation, setSelectedAllocation] = useState<ImportLandedCost | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [grnOptions, setGrnOptions] = useState<ImportGrn[]>([]);
  const [createGrnId, setCreateGrnId] = useState('');
  const [allocationMethod, setAllocationMethod] = useState('By Item Value');
  const [expenses, setExpenses] = useState({
    oceanFreightUsd: '',
    customsDutyUsd: '',
    marineInsuranceUsd: '',
    portDemurrageAndHandlingUsd: '',
    clearingAgencyChargesUsd: '',
    inlandTransportationUsd: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await importApi.listLandedCosts({ search });
      setItems(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('Error fetching landed costs:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load landed cost allocations');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    importApi
      .listGrns({ limit: 100 })
      .then((r) =>
        setGrnOptions((r.items || []).filter((g) => g.status === 'Inspected & Received' || g.isPosted))
      )
      .catch(() => setGrnOptions([]));
  }, []);

  const handleCreateLandedCost = async () => {
    if (!createGrnId) {
      setError('Select a posted GRN (Inspected & Received)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await importApi.createLandedCost({
        grnId: createGrnId,
        allocationMethod,
        oceanFreightUsd: Number(expenses.oceanFreightUsd) || 0,
        customsDutyUsd: Number(expenses.customsDutyUsd) || 0,
        marineInsuranceUsd: Number(expenses.marineInsuranceUsd) || 0,
        portDemurrageAndHandlingUsd: Number(expenses.portDemurrageAndHandlingUsd) || 0,
        clearingAgencyChargesUsd: Number(expenses.clearingAgencyChargesUsd) || 0,
        inlandTransportationUsd: Number(expenses.inlandTransportationUsd) || 0,
      });
      setIsCreateOpen(false);
      setCreateGrnId('');
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create allocation');
    } finally {
      setSaving(false);
    }
  };

  const handleReverseLandedCost = async (allocId: string) => {
    if (!window.confirm('Reverse this posted landed cost allocation?')) return;
    try {
      setActionLoading(true);
      await importApi.reverseLandedCost(allocId);
      fetchData();
      setSelectedAllocation(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to reverse');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostLandedCost = async (allocId: string) => {
    try {
      setActionLoading(true);
      const updated = await importApi.postLandedCost(allocId);
      setItems((prev) => prev.map((l) => (l.id === allocId ? { ...l, isPosted: true, journalEntryId: updated.journalEntryId } : l)));
      if (selectedAllocation && selectedAllocation.id === allocId) {
        setSelectedAllocation((prev) => (prev ? { ...prev, isPosted: true, journalEntryId: updated.journalEntryId } : null));
      }
      alert('Landed Cost allocation successfully posted to GL Inventory Valuation!');
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to post landed cost');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = items.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.lcaNumber || '').toLowerCase().includes(q) ||
      (l.importPoId || '').toLowerCase().includes(q) ||
      (l.importGrnId || '').toLowerCase().includes(q)
    );
  });

  return (
    <TradePage>
      <TradePageHeader
        title="Landed Cost Allocation"
        subtitle="Distribute freight, customs duties, insurance, port handling and clearance to inventory items"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<Calculator className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Allocation
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search allocation, PO, GRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading landed cost allocations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No landed cost records found.</p>
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={['Allocation No', 'Linked PO', 'Linked GRN', 'FOB Purchase (USD)', 'Landed Expenses', 'Final Valuation', 'Allocation Basis', 'Status', 'Actions']}
            />
            <TradeTableBody>
              {filtered.map((item) => (
                <TradeTableRow key={item.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{lcaLabel(item)}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    {lcaPoRef(item) !== '—' ? (
                      <Link href={`/import/purchase-orders?po=${lcaPoRef(item)}`} className="hover:underline text-blue-700">
                        {lcaPoRef(item)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600 font-mono text-xs">{lcaGrnRef(item)}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">{formatImportMoney(Number(item.purchaseFobTotalUsd || 0), baseCurrencyCode)}</TradeTableCell>
                  <TradeTableCell className="text-amber-700 font-bold text-xs">
                    +${Number(item.totalLandedExpensesUsd || 0).toLocaleString()}
                  </TradeTableCell>
                  <TradeTableCell className="font-extrabold text-emerald-700 text-sm">
                    {formatImportMoney(lcaFinalTotal(item), baseCurrencyCode)}
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      {item.allocationMethod || 'By Item Value'}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={lcaPosted(item) ? 'Posted' : item.status || 'Draft'} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedAllocation(item)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View Breakdown"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedAllocation)}
        onClose={() => setSelectedAllocation(null)}
        title={selectedAllocation ? lcaLabel(selectedAllocation) : 'Landed Cost Breakdown'}
        subtitle={`PO: ${selectedAllocation ? lcaPoRef(selectedAllocation) : 'N/A'} · GRN: ${selectedAllocation ? lcaGrnRef(selectedAllocation) : 'N/A'}`}
        actions={
          selectedAllocation && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {!lcaPosted(selectedAllocation) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePostLandedCost(selectedAllocation.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Post Landed Cost to GL
                </button>
              )}
              {lcaPosted(selectedAllocation) && !selectedAllocation.reversedAt && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReverseLandedCost(selectedAllocation.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  Reverse Posting
                </button>
              )}
              <Link
                href="/warehouse/inventory-valuation"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all text-center"
              >
                Open Warehouse Valuation
              </Link>
            </div>
          )
        }
      >
        {selectedAllocation && (
          <div className="space-y-6 text-xs">
            {/* Expense breakdown grid */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Import Component Expenses</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Ocean / Air Freight</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.oceanFreightUsd || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Customs Duty</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.customsDutyUsd || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Marine Insurance</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.marineInsuranceUsd || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Port Demurrage / Handling</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.portDemurrageAndHandlingUsd || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Clearing Agency Fees</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.clearingAgencyChargesUsd || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Inland Trucking</span>
                  <span className="font-bold text-gray-900">${Number(selectedAllocation.inlandTransportationUsd || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Item Allocation Result */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Item-Level Landed Unit Cost</h4>
              {selectedAllocation.items && selectedAllocation.items.length > 0 ? (
                <TradeTable>
                  <TradeTableHeader columns={['Product', 'Qty', 'Unit FOB ($)', 'Allocated Exp ($)', 'Final Landed Cost', 'Cost Variance %']} />
                  <TradeTableBody>
                    {selectedAllocation.items.map((it, idx) => {
                      const fob = Number(it.unitFobUsd ?? it.unitFobCostUsd ?? 0);
                      const landed = Number(it.finalLandedCostPerUnitUsd ?? it.totalLandedUnitCostUsd ?? fob);
                      const qty = Number(it.qty ?? it.receivedQty ?? 0);
                      const allocated = landed - fob;
                      const variance = fob > 0 ? ((allocated / fob) * 100).toFixed(1) : '0';

                      return (
                        <TradeTableRow key={it.id || idx}>
                          <TradeTableCell className="font-semibold text-gray-900">{it.productName}</TradeTableCell>
                          <TradeTableCell className="font-bold">{qty}</TradeTableCell>
                          <TradeTableCell>${fob.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="text-amber-700 font-semibold">+${allocated.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="font-extrabold text-[#014582]">${landed.toFixed(2)}</TradeTableCell>
                          <TradeTableCell className="font-bold text-emerald-600">+{variance}%</TradeTableCell>
                        </TradeTableRow>
                      );
                    })}
                  </TradeTableBody>
                </TradeTable>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-center">
                  No individual line item breakdown available.
                </div>
              )}
            </div>

            {selectedAllocation.journalEntryId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <span className="font-bold">Accounting GL Journal: </span>
                <span className="font-mono">{selectedAllocation.journalEntryId}</span>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Landed Cost Allocation"
        maxWidth="max-w-lg"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleCreateLandedCost} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Allocation'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <FormSection title="GRN source">
            <FieldLabel required>Posted GRN</FieldLabel>
            <select
              value={createGrnId}
              onChange={(e) => setCreateGrnId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 bg-white"
            >
              <option value="">Select GRN (Inspected & Received)…</option>
              {grnOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.grnNumber} — {g.status}
                </option>
              ))}
            </select>
          </FormSection>
          <FormSection title="Expense buckets (base currency)">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['oceanFreightUsd', 'Freight'],
                  ['customsDutyUsd', 'Duty'],
                  ['marineInsuranceUsd', 'Insurance'],
                  ['portDemurrageAndHandlingUsd', 'Demurrage / port'],
                  ['clearingAgencyChargesUsd', 'Clearing'],
                  ['inlandTransportationUsd', 'Inland'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <input
                    type="number"
                    value={expenses[key]}
                    onChange={(e) => setExpenses((ex) => ({ ...ex, [key]: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Allocation">
            <FieldLabel>Method</FieldLabel>
            <select
              value={allocationMethod}
              onChange={(e) => setAllocationMethod(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 bg-white"
            >
              {['By Item Value', 'By Quantity', 'By Weight', 'Equal Split', 'Manual'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormSection>
        </div>
      </TradeModal>
    </TradePage>
  );
}
