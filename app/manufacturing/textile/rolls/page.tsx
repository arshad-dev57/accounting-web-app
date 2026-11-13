'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../_components/SandboxGate';
import { textileMfgService } from '@/lib/textile-mfg-service';

export default function RollsPage() {
  return (
    <SandboxGate title="Fabric Rolls" subtitle="Foundation records only — roll formation is not in P0">
      {() => <Rolls />}
    </SandboxGate>
  );
}

function Rolls() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [rollCode, setRollCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await textileMfgService.listRolls());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rolls');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setError('');
    try {
      await textileMfgService.createRoll({
        rollCode: rollCode || undefined,
        stage: 'Greige',
        status: 'Draft',
        notes: 'P0 foundation record'
      });
      setRollCode('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <MfgPage>
      <MfgPageHeader title="Fabric Rolls" subtitle="Schema + CRUD foundation for later greige/dye/finish flows" backHref="/manufacturing/textile/sandbox" />
      <MfgCard title="Create foundation roll">
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
            placeholder="Optional roll code"
            value={rollCode}
            onChange={(e) => setRollCode(e.target.value)}
          />
          <button type="button" disabled={busy} onClick={() => void create()} className="rounded-xl bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
            {busy ? 'Saving…' : 'Create Roll Record'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </MfgCard>
      <MfgCard>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#7A8FA6] border-b">
              <th className="py-2 pr-3">Roll</th>
              <th className="py-2 pr-3">Stage</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#EEF2F7]">
                <td className="py-2 pr-3 font-semibold">{row.rollCode}</td>
                <td className="py-2 pr-3">{row.stage}</td>
                <td className="py-2 pr-3"><MfgStatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </MfgCard>
    </MfgPage>
  );
}
