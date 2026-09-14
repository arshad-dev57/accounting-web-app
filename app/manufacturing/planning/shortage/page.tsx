'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { materialShortageService } from '@/lib/manufacturing-service';
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
  MfgStatCard,
  MFG_COLORS,
} from '../../ui';

export default function MaterialShortagePage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, summary: s } = await materialShortageService.check({ locationId: locationIdForApi || undefined });
      setRows(data || []);
      setSummary(s || {});
      if ((data || []).length === 0) toast.success('No material shortages');
    } catch (e: any) {
      setError(e.message || 'Failed to check shortage');
    } finally {
      setLoading(false);
    }
  };

  const n = (v: any) => Number(v || 0);

  return (
    <MfgPage>
      <MfgPageHeader
        title="Material Shortage"
        subtitle="Identify shortages that require purchase or incoming stock"
        icon={<AlertTriangle className="w-5 h-5 text-white" />}
        actions={<MfgButton onClick={check} loading={loading}>Check Shortage</MfgButton>}
      />

      {summary.shortageCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MfgStatCard label="Materials Short" value={summary.shortageCount ?? rows.length} icon={AlertTriangle} color={MFG_COLORS.danger} />
          <MfgStatCard label="Shortage Qty" value={summary.shortageQty ?? 0} icon={AlertTriangle} color={MFG_COLORS.danger} />
        </div>
      )}

      {error ? <MfgError message={error} /> : loading ? <MfgLoading label="Checking availability…" /> : (
        <MfgCard title="Shortage Report">
          {rows.length === 0 ? (
            <MfgEmpty title="No shortage data"
              message="Run the check to compare required materials against available, reserved and incoming stock." />
          ) : (
            <MfgTable columns={['Material', 'Required', 'Available', 'Reserved', 'Shortage']}>
              {rows.map((r, i) => (
                <MfgTableRow key={r.productId || i}>
                  <MfgTableCell className="font-semibold">{r.productName || r.materialName || r.name || '—'}</MfgTableCell>
                  <MfgTableCell>{r.required ?? r.requiredQty ?? '—'}</MfgTableCell>
                  <MfgTableCell>{n(r.available ?? r.availableQty) - n(r.reserved ?? r.reservedQty)}</MfgTableCell>
                  <MfgTableCell>{r.reserved ?? r.reservedQty ?? '—'}</MfgTableCell>
                  <MfgTableCell className="text-[#E74C3C] font-bold">{r.shortage ?? r.shortageQty ?? '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
      )}
    </MfgPage>
  );
}
