'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw } from 'lucide-react';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../_components/SandboxGate';
import { textileMfgService, type TextileWindingEntry } from '@/lib/textile-mfg-service';

export default function ConeWindingListPage() {
  return (
    <SandboxGate title="Cone Winding" subtitle="Yarn LOT → individual cones with inventory + genealogy">
      {(ctx) => <WindingList onRefreshSandbox={() => void ctx.refresh()} />}
    </SandboxGate>
  );
}

function WindingList({ onRefreshSandbox }: { onRefreshSandbox: () => void }) {
  const [rows, setRows] = useState<TextileWindingEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await textileMfgService.listWinding());
      onRefreshSandbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load winding entries');
    } finally {
      setLoading(false);
    }
  }, [onRefreshSandbox]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MfgPage>
      <MfgPageHeader
        title="Cone Winding"
        subtitle="Post production to consume yarn LOT stock and create traceable cones"
        backHref="/manufacturing/textile/sandbox"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <Link href="/manufacturing/textile/winding/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#014582]">
              <Plus className="w-4 h-4" /> New Entry
            </Link>
          </div>
        }
      />
      <MfgCard>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-[#7A8FA6]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#7A8FA6]">No winding entries yet. Create one to wind yarn into cones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#7A8FA6] border-b border-[#DDE4EE]">
                  <th className="py-2 pr-3 font-semibold">Entry</th>
                  <th className="py-2 pr-3 font-semibold">LOT</th>
                  <th className="py-2 pr-3 font-semibold">Input</th>
                  <th className="py-2 pr-3 font-semibold">Output</th>
                  <th className="py-2 pr-3 font-semibold">Waste</th>
                  <th className="py-2 pr-3 font-semibold">Cones</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#EEF2F7] hover:bg-[#F8FAFC]">
                    <td className="py-2.5 pr-3">
                      <Link href={`/manufacturing/textile/winding/${row.id}`} className="font-semibold text-[#014582]">
                        {row.entryNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">{row.yarnLotNumber}</td>
                    <td className="py-2.5 pr-3">{row.inputWeightKg} KG</td>
                    <td className="py-2.5 pr-3">{row.outputWeightKg} KG</td>
                    <td className="py-2.5 pr-3">{row.wastageKg} KG</td>
                    <td className="py-2.5 pr-3">{row.coneCount}</td>
                    <td className="py-2.5 pr-3"><MfgStatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MfgCard>
    </MfgPage>
  );
}
