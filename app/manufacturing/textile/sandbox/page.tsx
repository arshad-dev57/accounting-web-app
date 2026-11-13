'use client';

import React from 'react';
import Link from 'next/link';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { MfgCard, MfgPage, MfgPageHeader, MfgStatCard } from '@/manufacturing/ui';
import { SandboxGate } from '../_components/SandboxGate';

export default function TextileSandboxPage() {
  return (
    <SandboxGate title="Textile Sandbox" subtitle="Isolated company for P0 cone winding — no live inventory impact">
      {(ctx) => (
        <MfgPage>
          <MfgPageHeader
            title="Textile Sandbox"
            subtitle="Active in TEXTILE-SANDBOX — yarn LOT, winding machine, and cone stock are company-scoped"
            icon={<FlaskConical className="w-5 h-5 text-white" />}
            actions={
              <Link
                href="/manufacturing/textile/winding/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
              >
                New Cone Winding <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MfgStatCard
              label="Yarn on hand"
              value={`${Number(ctx.status?.masters?.yarnStockKg || 0).toFixed(1)} KG`}
              icon={FlaskConical}
              color="#014582"
              hint={ctx.status?.masters?.yarnProductName || 'Cotton Yarn'}
            />
            <MfgStatCard
              label="Yarn LOT"
              value={`${Number(ctx.status?.masters?.yarnLotKg || 0).toFixed(1)} KG`}
              icon={FlaskConical}
              color="#0FA3E0"
              hint={ctx.status?.masters?.yarnLotNumber || 'YRN-TEST-001'}
            />
            <MfgStatCard
              label="Cone stock"
              value={`${Number(ctx.status?.masters?.coneStockKg || 0).toFixed(1)} KG`}
              icon={FlaskConical}
              color="#2ECC71"
              hint={ctx.status?.masters?.coneProductName || 'Yarn Cone'}
            />
            <MfgStatCard
              label="Machine"
              value={ctx.status?.masters?.machineName || '—'}
              icon={FlaskConical}
              color="#8E44AD"
              hint={ctx.status?.masters?.warehouseName || 'Main Warehouse'}
            />
          </div>
          <MfgCard title="Seeded masters">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#7A8FA6]">Company</dt><dd className="font-semibold text-[#1A1A2E]">{ctx.status?.sandboxCompany?.name}</dd></div>
              <div><dt className="text-[#7A8FA6]">Warehouse</dt><dd className="font-semibold">{ctx.status?.masters?.warehouseName}</dd></div>
              <div><dt className="text-[#7A8FA6]">Yarn</dt><dd className="font-semibold">{ctx.status?.masters?.yarnProductName}</dd></div>
              <div><dt className="text-[#7A8FA6]">Cone product</dt><dd className="font-semibold">{ctx.status?.masters?.coneProductName}</dd></div>
              <div><dt className="text-[#7A8FA6]">LOT</dt><dd className="font-semibold">{ctx.status?.masters?.yarnLotNumber}</dd></div>
              <div><dt className="text-[#7A8FA6]">Winding machine</dt><dd className="font-semibold">{ctx.status?.masters?.machineName}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/manufacturing/textile/winding" className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm font-semibold text-[#014582]">Cone Winding</Link>
              <Link href="/manufacturing/textile/cones" className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm font-semibold text-[#014582]">Cones / Genealogy</Link>
              <Link href="/manufacturing/textile/beams" className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm font-semibold text-[#014582]">Beams (foundation)</Link>
              <Link href="/manufacturing/textile/rolls" className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm font-semibold text-[#014582]">Fabric Rolls (foundation)</Link>
              <button type="button" onClick={() => void ctx.refresh()} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm font-semibold">Refresh inventory</button>
            </div>
          </MfgCard>
        </MfgPage>
      )}
    </SandboxGate>
  );
}
