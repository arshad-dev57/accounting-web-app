'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { GitFork, PlayCircle } from 'lucide-react';
import { mrpService } from '@/lib/manufacturing-service';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgButton,
  MfgLoading,
  MfgError,
  MfgEmpty,
} from '../../ui';

export default function MrpPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mrpService.run({});
      setData(res?.data ?? res ?? {});
    } catch (e: any) {
      setError(e.message || 'Failed to run MRP');
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(data) ? data : Array.isArray(data?.requirements) ? data.requirements : Array.isArray(data?.items) ? data.items : [];

  return (
    <MfgPage>
      <MfgPageHeader
        title="Material Requirements Planning (MRP)"
        subtitle="BOM explosion → required vs available → shortage → purchase/production suggestion"
        icon={<GitFork className="w-5 h-5 text-white" />}
        actions={<MfgButton onClick={run} loading={loading}><PlayCircle className="w-4 h-4" /> Run MRP</MfgButton>}
      />

      {error ? <MfgError message={error} /> : loading ? <MfgLoading label="Running MRP…" /> : (
        <MfgCard title="Material Requirements">
          {!data || items.length === 0 ? (
            <MfgEmpty title="Run MRP to calculate requirements"
              message="MRP explodes the BOM for scheduled production and compares it against current, reserved and incoming stock." />
          ) : (
            <>
              <MfgTable columns={['Material', 'Required', 'Available', 'Reserved', 'Incoming', 'Shortage', 'Suggested Purchase', 'Suggested Production']}>
                {items.map((r: any, i: number) => (
                  <MfgTableRow key={r.productId || r.materialId || i}>
                    <MfgTableCell className="font-semibold">{r.productName || r.materialName || r.name || '—'}</MfgTableCell>
                    <MfgTableCell>{r.required ?? r.requiredQty ?? '—'}</MfgTableCell>
                    <MfgTableCell>{r.available ?? r.availableQty ?? '—'}</MfgTableCell>
                    <MfgTableCell>{r.reserved ?? r.reservedQty ?? '—'}</MfgTableCell>
                    <MfgTableCell>{r.incoming ?? r.incomingQty ?? '—'}</MfgTableCell>
                    <MfgTableCell className={Number(r.shortage ?? r.shortageQty ?? 0) > 0 ? 'text-[#E74C3C] font-bold' : ''}>{r.shortage ?? r.shortageQty ?? '—'}</MfgTableCell>
                    <MfgTableCell>{r.suggestedPurchaseQty ?? r.suggestedPurchase ?? '—'}</MfgTableCell>
                    <MfgTableCell>{r.suggestedProductionQty ?? r.suggestedProduction ?? '—'}</MfgTableCell>
                  </MfgTableRow>
                ))}
              </MfgTable>
              <p className="mt-3 text-[11px] text-[#7A8FA6]">
                Purchase orders are never auto-created unless your Manufacturing configuration allows it.
              </p>
            </>
          )}
        </MfgCard>
      )}
    </MfgPage>
  );
}
