'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../_components/SandboxGate';
import { textileMfgService, type TextileCone } from '@/lib/textile-mfg-service';

export default function ConesPage() {
  return (
    <SandboxGate title="Textile Cones" subtitle="Individual cone inventory with yarn LOT genealogy">
      {() => <ConeList />}
    </SandboxGate>
  );
}

function ConeList() {
  const [rows, setRows] = useState<TextileCone[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await textileMfgService.listCones());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cones');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MfgPage>
      <MfgPageHeader title="Cones" subtitle="Trace each cone back to its yarn LOT" backHref="/manufacturing/textile/sandbox" />
      <MfgCard>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#7A8FA6] border-b">
              <th className="py-2 pr-3">Cone ID</th>
              <th className="py-2 pr-3">Yarn LOT</th>
              <th className="py-2 pr-3">Weight</th>
              <th className="py-2 pr-3">Winding</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#EEF2F7]">
                <td className="py-2 pr-3">
                  <Link className="font-semibold text-[#014582]" href={`/manufacturing/textile/cones/${row.id}`}>
                    {row.coneCode}
                  </Link>
                </td>
                <td className="py-2 pr-3">{row.yarnLotNumber}</td>
                <td className="py-2 pr-3">{row.weightKg} KG</td>
                <td className="py-2 pr-3">{row.windingEntry?.entryNumber || '—'}</td>
                <td className="py-2 pr-3"><MfgStatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error && <p className="text-sm text-[#7A8FA6]">No cones yet.</p>}
      </MfgCard>
    </MfgPage>
  );
}
