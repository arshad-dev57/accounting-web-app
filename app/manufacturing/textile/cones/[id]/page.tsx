'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatusBadge } from '@/manufacturing/ui';
import { SandboxGate } from '../../_components/SandboxGate';
import { textileMfgService, type TextileCone } from '@/lib/textile-mfg-service';

export default function ConeDetailPage() {
  return (
    <SandboxGate title="Cone Genealogy" subtitle="Yarn LOT → Cone traceability">
      {() => <ConeDetail />}
    </SandboxGate>
  );
}
function ConeDetail() {
  const params = useParams<{ id: string }>();
  const [cone, setCone] = useState<TextileCone | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    void (async () => {
      try {
        setCone(await textileMfgService.getCone(params.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cone');
      }
    })();
  }, [params.id]);

  if (!cone) {
    return (
      <MfgPage>
        <MfgCard>{error || 'Loading…'}</MfgCard>
      </MfgPage>
    );
  }

  return (
    <MfgPage>
      <MfgPageHeader title={cone.coneCode} subtitle={`Weight ${cone.weightKg} KG`} backHref="/manufacturing/textile/cones" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MfgCard title="Cone">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Status</span><MfgStatusBadge status={cone.status} /></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Yarn LOT</span><span className="font-semibold">{cone.yarnLotNumber}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Warehouse</span><span>{cone.warehouse?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Winding</span><span>{cone.windingEntry?.entryNumber || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">QR</span><span className="text-xs">{String(cone.qrCode || '—')}</span></div>
          </dl>
        </MfgCard>
        <MfgCard title="Material genealogy">
          <p className="text-xs text-[#7A8FA6] mb-3">Parents that produced this cone</p>
          {(cone.genealogy?.yarnLots || []).length === 0 ? (
            <p className="text-sm text-[#7A8FA6]">No genealogy links (draft / unposted).</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(cone.genealogy?.yarnLots || []).map((lot, idx) => (
                <li key={idx} className="rounded-xl border border-[#DDE4EE] px-3 py-2">
                  <div className="font-semibold text-[#014582]">Yarn LOT {lot.lotNumber}</div>
                  <div className="text-xs text-[#7A8FA6]">{lot.quantity} {lot.unit || 'KG'} consumed into this cone</div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#7A8FA6] mb-2">All parent links</p>
            <ul className="space-y-1 text-xs text-[#1A1A2E]">
              {((cone.genealogy?.parents || []) as any[]).map((p, idx) => (
                <li key={idx}>{p.parentType} {p.parentCode || p.parentId} → {p.childType} ({p.relation})</li>
              ))}
            </ul>
          </div>
        </MfgCard>
      </div>
    </MfgPage>
  );
}
