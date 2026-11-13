'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../../_components/SandboxGate';
import { textileMfgService, type TextileWindingEntry } from '@/lib/textile-mfg-service';

export default function WindingDetailPage() {
  return (
    <SandboxGate title="Winding Entry" subtitle="Production detail, cones, and stock posting">
      {() => <Detail />}
    </SandboxGate>
  );
}

function Detail() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const [row, setRow] = useState<TextileWindingEntry | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setRow(await textileMfgService.getWinding(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  async function post() {
    setBusy(true);
    setError('');
    try {
      setRow(await textileMfgService.postWinding(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post failed');
    } finally {
      setBusy(false);
    }
  }

  if (!row) {
    return (
      <MfgPage>
        <MfgCard>{error || 'Loading…'}</MfgCard>
      </MfgPage>
    );
  }

  return (
    <MfgPage>
      <MfgPageHeader
        title={row.entryNumber}
        subtitle={`${row.yarnProductName} → ${row.coneProductName}`}
        backHref="/manufacturing/textile/winding"
        actions={
          row.status === 'Draft' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void post()}
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#014582]"
            >
              {busy ? 'Posting…' : 'Post to Inventory'}
            </button>
          ) : (
            <MfgStatusBadge status={row.status} />
          )
        }
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MfgCard title="Production">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#7A8FA6]">LOT</span><span className="font-semibold">{row.yarnLotNumber}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Input</span><span>{row.inputWeightKg} KG</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Output</span><span>{row.outputWeightKg} KG</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Wastage</span><span>{row.wastageKg} KG</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Rejected</span><span>{row.rejectedWeightKg} KG</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Remaining</span><span>{row.remainingYarnKg} KG</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Operator</span><span>{row.operatorName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Shift</span><span>{row.shift || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Machine</span><span>{row.machine?.name || '—'}</span></div>
          </dl>
        </MfgCard>
        <MfgCard title="Cones" className="md:col-span-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#7A8FA6] border-b">
                <th className="py-2 pr-3">Cone ID</th>
                <th className="py-2 pr-3">Weight</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Genealogy</th>
              </tr>
            </thead>
            <tbody>
              {(row.cones || []).map((cone) => (
                <tr key={cone.id} className="border-b border-[#EEF2F7]">
                  <td className="py-2 pr-3 font-semibold text-[#014582]">
                    <Link href={`/manufacturing/textile/cones/${cone.id}`}>{cone.coneCode}</Link>
                  </td>
                  <td className="py-2 pr-3">{cone.weightKg} KG</td>
                  <td className="py-2 pr-3"><MfgStatusBadge status={cone.status} /></td>
                  <td className="py-2 pr-3 text-xs text-[#7A8FA6]">LOT {cone.yarnLotNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </MfgCard>
      </div>
    </MfgPage>
  );
}
