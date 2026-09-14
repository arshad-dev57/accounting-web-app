'use client';

import React, { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { costingService } from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from '../_components/ProductPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgLoading,
  MfgError,
  MfgEmpty,
} from '../ui';

const TABS = [
  { key: 'standard', label: 'Standard' },
  { key: 'actual', label: 'Actual' },
  { key: 'variance', label: 'Variance' },
  { key: 'product', label: 'Product lookup' },
] as const;

function rowsFrom(res: any): any[] {
  const d = res?.data ?? res ?? {};
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.items)) return d.items;
  return [];
}

export default function CostingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('standard');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<PickedProduct[]>([]);
  const [productCost, setProductCost] = useState<any>(null);
  const productId = picked[0]?.id || '';

  useEffect(() => {
    if (tab === 'product') {
      setLoading(false);
      setError('');
      return;
    }
    let mounted = true;
    setLoading(true);
    setError('');
    const fetcher =
      tab === 'standard' ? costingService.standard :
      tab === 'actual' ? costingService.actual :
      costingService.variance;
    fetcher({})
      .then((res) => { if (mounted) setRows(rowsFrom(res)); })
      .catch((e: any) => { if (mounted) setError(e.message || 'Failed to load costing'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [tab]);

  const lookup = async () => {
    if (!productId.trim()) return;
    setLoading(true);
    setError('');
    try {
      setProductCost(await costingService.productCost(productId.trim()));
    } catch (e: any) {
      setError(e.message || 'Failed to load product cost');
      setProductCost(null);
    } finally {
      setLoading(false);
    }
  };

  const ref = productCost?.data ?? productCost ?? {};

  return (
    <MfgPage>
      <MfgPageHeader
        title="Manufacturing Costing"
        subtitle="Standard, actual and variance cost in one place"
        icon={<Calculator className="w-5 h-5 text-white" />}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-[#014582] text-white' : 'bg-white text-[#7A8FA6] border border-[#DDE4EE] hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'product' ? (
        <>
          <MfgCard title="Lookup Product">
            <div className="flex gap-3 max-w-xl items-start">
              <div className="flex-1">
                <ProductPicker
                  multiple={false}
                  selected={picked}
                  placeholder="Select product…"
                  onChange={setPicked}
                />
              </div>
              <button onClick={lookup} className="px-4 py-2.5 rounded-xl bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a] transition-all whitespace-nowrap">Calculate</button>
            </div>
          </MfgCard>
          {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : productCost ? (
            <MfgCard title="Cost Breakdown">
              <div className="space-y-3">
                {[
                  ['Material Cost', ref.materialCost],
                  ['Labor Cost', ref.laborCost],
                  ['Machine Cost', ref.machineCost],
                  ['Overhead', ref.overhead],
                  ['Subcontracting', ref.subcontractingCost],
                  ['Total Cost', ref.totalCost],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A1A2E]">{label}</span>
                    <span className="text-sm font-extrabold text-[#014582]">{Number(value || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </MfgCard>
          ) : <MfgEmpty title="Select a product" message="Pick a product to see its manufacturing cost breakdown." />}
        </>
      ) : loading ? <MfgLoading /> : error ? <MfgError message={error} /> : (
        <MfgCard title={`${TABS.find((t) => t.key === tab)?.label} cost`}>
          {rows.length === 0 ? (
            <MfgEmpty title="No cost data" message="Costs appear after BOMs and completed production orders exist." />
          ) : tab === 'variance' ? (
            <MfgTable columns={['Product', 'Standard', 'Actual', 'Variance', 'Material Var', 'Labor Var']}>
              {rows.map((r, i) => (
                <MfgTableRow key={r.id || r.productId || i}>
                  <MfgTableCell className="font-semibold">{r.productName || r.productId || '—'}</MfgTableCell>
                  <MfgTableCell>{r.standardCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.actualCost ?? '—'}</MfgTableCell>
                  <MfgTableCell className={Number(r.variance ?? 0) > 0 ? 'text-[#E74C3C] font-bold' : 'text-[#2ECC71] font-bold'}>{r.variance ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.materialVariance ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.laborVariance ?? '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          ) : tab === 'actual' ? (
            <MfgTable columns={['MO #', 'Product', 'Material', 'Labor', 'Machine', 'Overhead', 'Total']}>
              {rows.map((r, i) => (
                <MfgTableRow key={r.id || r.productionOrderId || i}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrderId || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || '—'}</MfgTableCell>
                  <MfgTableCell>{r.materialCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.laborCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.machineCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.overhead ?? r.overheadCost ?? '—'}</MfgTableCell>
                  <MfgTableCell className="font-bold text-[#014582]">{r.totalCost ?? '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          ) : (
            <MfgTable columns={['Product', 'Material', 'Labor', 'Machine', 'Overhead', 'Total']}>
              {rows.map((r, i) => (
                <MfgTableRow key={r.id || r.productId || i}>
                  <MfgTableCell className="font-semibold">{r.productName || r.productId || '—'}</MfgTableCell>
                  <MfgTableCell>{r.materialCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.laborCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.machineCost ?? '—'}</MfgTableCell>
                  <MfgTableCell>{r.overhead ?? r.overheadCost ?? '—'}</MfgTableCell>
                  <MfgTableCell className="font-bold text-[#014582]">{r.totalCost ?? '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
      )}
    </MfgPage>
  );
}
