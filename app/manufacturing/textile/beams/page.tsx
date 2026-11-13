'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../_components/SandboxGate';
import { textileMfgService } from '@/lib/textile-mfg-service';

export default function BeamsPage() {
  return (
    <SandboxGate title="Textile Beams" subtitle="Foundation records only — warping workflow is not in P0">
      {() => <Beams />}
    </SandboxGate>
  );
}

function Beams() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [beamCode, setBeamCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await textileMfgService.listBeams());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load beams');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setError('');
    try {
      await textileMfgService.createBeam({
        beamCode: beamCode || undefined,
        status: 'Draft',
        beamType: 'Warping',
        notes: 'P0 foundation record'
      });
      setBeamCode('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <MfgPage>
      <MfgPageHeader title="Beams" subtitle="Schema + CRUD foundation for later warping/sizing" backHref="/manufacturing/textile/sandbox" />
      <MfgCard title="Create foundation beam">
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm"
            placeholder="Optional beam code"
            value={beamCode}
            onChange={(e) => setBeamCode(e.target.value)}
          />
          <button type="button" disabled={busy} onClick={() => void create()} className="rounded-xl bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
            {busy ? 'Saving…' : 'Create Beam Record'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </MfgCard>
      <MfgCard>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#7A8FA6] border-b">
              <th className="py-2 pr-3">Beam</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#EEF2F7]">
                <td className="py-2 pr-3 font-semibold">{row.beamCode}</td>
                <td className="py-2 pr-3">{row.beamType}</td>
                <td className="py-2 pr-3"><MfgStatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </MfgCard>
    </MfgPage>
  );
}
