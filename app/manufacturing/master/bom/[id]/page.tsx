'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Boxes } from 'lucide-react';
import { bomService } from '@/lib/manufacturing-service';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgLoading,
  MfgError,
} from '../../../ui';

export default function BomDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const [bom, setBom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setBom(await bomService.get(id));
    } catch (e: any) {
      setError(e.message || 'Failed to load BOM');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error || !bom) return <MfgPage><MfgError message={error || 'BOM not found'} /></MfgPage>;

  const components = bom.components || bom.items || [];
  const n = (v: any) => Number(v || 0);

  return (
    <MfgPage>
      <MfgPageHeader
        title={bom.bomNumber || bom.name || 'Bill of Materials'}
        subtitle={`${bom.productName || bom.product?.name || 'Product'} · v${bom.version || '0'}`}
        backHref="/manufacturing/master/bom"
        icon={<Boxes className="w-5 h-5 text-white" />}
        actions={<MfgStatusBadge status={bom.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MfgCard title="Summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">BOM Number</dt><dd className="font-semibold">{bom.bomNumber || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Version</dt><dd className="font-semibold">{bom.version || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Status</dt><dd className="font-semibold">{bom.status || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Effective From</dt><dd className="font-semibold">{bom.effectiveFrom ? new Date(bom.effectiveFrom).toLocaleDateString('en-GB') : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Effective To</dt><dd className="font-semibold">{bom.effectiveTo ? new Date(bom.effectiveTo).toLocaleDateString('en-GB') : '—'}</dd></div>
          </dl>
        </MfgCard>

        <MfgCard title="Estimated Cost">
          <p className="text-3xl font-extrabold text-[#014582]">
            {n(bom.totalEstimatedCost ?? bom.estimatedCost).toLocaleString()}
          </p>
          <p className="text-xs text-[#7A8FA6] mt-1">Sum of component costs</p>
        </MfgCard>

        <MfgCard title="Component Count">
          <p className="text-3xl font-extrabold text-[#8E44AD]">{components.length}</p>
          <p className="text-xs text-[#7A8FA6] mt-1">Quantity lines in this BOM</p>
        </MfgCard>
      </div>

      <MfgCard title="Components — Multi-level BOM">
        {components.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#7A8FA6]">No components defined.</p>
        ) : (
          <MfgTable columns={['Component', 'Qty', 'UoM', 'Scrap %', 'Substitute', 'Operation']}>
            {components.map((c: any, i: number) => (
              <MfgTableRow key={c.id || c.productId || i}>
                <MfgTableCell className="font-medium">{c.productName || c.name || c.product?.name || '—'}</MfgTableCell>
                <MfgTableCell>{n(c.quantity)}</MfgTableCell>
                <MfgTableCell>{c.unit || c.uom || c.unitOfMeasure || '—'}</MfgTableCell>
                <MfgTableCell>{n(c.scrapPct)}%</MfgTableCell>
                <MfgTableCell>{c.substituteName || c.substituteProductName || '—'}</MfgTableCell>
                <MfgTableCell>{c.operationName || c.operation?.name || '—'}</MfgTableCell>
              </MfgTableRow>
            ))}
          </MfgTable>
        )}
        {bom.notes && <p className="mt-4 text-xs text-[#7A8FA6]">{bom.notes}</p>}
      </MfgCard>
    </MfgPage>
  );
}
