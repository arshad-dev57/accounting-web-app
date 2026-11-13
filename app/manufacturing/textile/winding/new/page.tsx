'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Factory } from 'lucide-react';
import { MfgCard, MfgPage, MfgPageHeader } from '@/manufacturing/ui';
import { SandboxGate } from '../../_components/SandboxGate';
import { textileMfgService, type TextileYarnLot } from '@/lib/textile-mfg-service';

type ConeRow = { weightKg: string; status: 'Available' | 'Rejected' };

export default function NewConeWindingPage() {
  return (
    <SandboxGate title="New Cone Winding" subtitle="Select yarn LOT, machine, and record cone production">
      {(ctx) => <WindingForm masters={ctx.status?.masters || null} onDone={() => void ctx.refresh()} />}
    </SandboxGate>
  );
}

function WindingForm({
  masters,
  onDone
}: {
  masters: {
    warehouseId: string | null;
    yarnProductId: string | null;
    coneProductId: string | null;
    yarnLotNumber: string;
    machineId: string | null;
    yarnLotKg?: number;
    yarnStockKg?: number;
  } | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [lots, setLots] = useState<TextileYarnLot[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [yarnLotNumber, setYarnLotNumber] = useState(masters?.yarnLotNumber || 'YRN-TEST-001');
  const [machineId, setMachineId] = useState(masters?.machineId || '');
  const [operatorName, setOperatorName] = useState('Sandbox Operator');
  const [shift, setShift] = useState('A');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [inputWeightKg, setInputWeightKg] = useState('1000');
  const [outputWeightKg, setOutputWeightKg] = useState('990');
  const [wastageKg, setWastageKg] = useState('10');
  const [rejectedWeightKg, setRejectedWeightKg] = useState('0');
  const [remainingYarnKg, setRemainingYarnKg] = useState('0');
  const [targetOutputKg, setTargetOutputKg] = useState('990');
  const [runningHours, setRunningHours] = useState('8');
  const [downtimeHours, setDowntimeHours] = useState('0.5');
  const [coneMode, setConeMode] = useState<'equal' | 'manual'>('equal');
  const [coneCount, setConeCount] = useState('10');
  const [cones, setCones] = useState<ConeRow[]>(
    Array.from({ length: 10 }, () => ({ weightKg: '99', status: 'Available' }))
  );
  const [postNow, setPostNow] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [lotRows, machineRows] = await Promise.all([
          textileMfgService.yarnLots({
            productId: masters?.yarnProductId || undefined,
            warehouseId: masters?.warehouseId || undefined
          }),
          textileMfgService.machines()
        ]);
        setLots(lotRows);
        setMachines(machineRows);
        if (!machineId && machineRows[0]?.id) setMachineId(machineRows[0].id);
        if (lotRows[0]?.lotNumber) setYarnLotNumber(lotRows[0].lotNumber);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load masters');
      }
    })();
  }, [masters?.yarnProductId, masters?.warehouseId]);

  const selectedLot = useMemo(
    () => lots.find((l) => l.lotNumber === yarnLotNumber) || null,
    [lots, yarnLotNumber]
  );
  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === machineId) || null,
    [machines, machineId]
  );

  useEffect(() => {
    if (coneMode !== 'equal') return;
    const out = Number(outputWeightKg) || 0;
    const count = Math.max(1, Math.floor(Number(coneCount) || 1));
    const base = Math.floor((out / count) * 1000) / 1000;
    const rows: ConeRow[] = [];
    let allocated = 0;
    for (let i = 0; i < count; i += 1) {
      const weight = i === count - 1 ? Math.round((out - allocated) * 1000) / 1000 : base;
      allocated = Math.round((allocated + weight) * 1000) / 1000;
      rows.push({ weightKg: String(weight), status: 'Available' });
    }
    setCones(rows);
  }, [coneMode, coneCount, outputWeightKg]);

  const balanceHint = useMemo(() => {
    const input = Number(inputWeightKg) || 0;
    const output = Number(outputWeightKg) || 0;
    const waste = Number(wastageKg) || 0;
    const rejected = Number(rejectedWeightKg) || 0;
    const remaining = Number(remainingYarnKg) || 0;
    const sum = Math.round((output + waste + rejected + remaining) * 1000) / 1000;
    return { input, sum, ok: Math.abs(sum - input) <= 0.05 };
  }, [inputWeightKg, outputWeightKg, wastageKg, rejectedWeightKg, remainingYarnKg]);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (!masters?.yarnProductId || !masters?.coneProductId || !masters?.warehouseId) {
        throw new Error('Sandbox masters incomplete — re-enter TEXTILE-SANDBOX');
      }
      if (!balanceHint.ok) {
        throw new Error(`Mass balance failed: input ${balanceHint.input} ≠ ${balanceHint.sum}`);
      }
      const body: Record<string, unknown> = {
        yarnProductId: masters.yarnProductId,
        coneProductId: masters.coneProductId,
        yarnLotNumber,
        sourceWarehouseId: masters.warehouseId,
        outputWarehouseId: masters.warehouseId,
        machineId: machineId || undefined,
        machineOwningCompanyId: selectedMachine?.owningCompanyId || selectedMachine?.owningCompany?.id,
        machineOperatingCompanyId: selectedMachine?.operatingCompanyId || selectedMachine?.operatingCompany?.id,
        operatorName,
        shift,
        productionDate,
        targetOutputKg: Number(targetOutputKg),
        inputWeightKg: Number(inputWeightKg),
        outputWeightKg: Number(outputWeightKg),
        wastageKg: Number(wastageKg),
        rejectedWeightKg: Number(rejectedWeightKg),
        remainingYarnKg: Number(remainingYarnKg),
        runningHours: Number(runningHours),
        downtimeHours: Number(downtimeHours),
        cones: cones.map((c) => ({
          weightKg: Number(c.weightKg),
          status: c.status
        })),
        post: postNow
      };
      const created = await textileMfgService.createWinding(body);
      onDone();
      router.push(`/manufacturing/textile/winding/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save winding entry');
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#014582]/20';
  const label = 'block text-xs font-semibold text-[#7A8FA6] mb-1';

  return (
    <MfgPage>
      <MfgPageHeader
        title="New Cone Winding"
        subtitle={`LOT available: ${Number(selectedLot?.currentStock ?? masters?.yarnLotKg ?? 0).toFixed(1)} KG`}
        backHref="/manufacturing/textile/winding"
        icon={<Factory className="w-5 h-5 text-white" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MfgCard title="Material & machine" className="lg:col-span-1">
          <div className="space-y-3">
            <div>
              <label className={label}>Yarn LOT</label>
              <select className={field} value={yarnLotNumber} onChange={(e) => setYarnLotNumber(e.target.value)}>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.lotNumber}>
                    {lot.lotNumber} — {lot.currentStock} KG @ {lot.warehouseName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Winding machine</label>
              <select className={field} value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                <option value="">Select machine</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machineCode})
                  </option>
                ))}
              </select>
            </div>
            {selectedMachine && (
              <div className="rounded-xl bg-[#F5F8FC] px-3 py-2 text-xs text-[#1A1A2E] space-y-1">
                <div>Owner: <b>{selectedMachine.owningCompany?.name || 'Sandbox'}</b></div>
                <div>Operator co.: <b>{selectedMachine.operatingCompany?.name || 'Sandbox'}</b></div>
              </div>
            )}
            <div>
              <label className={label}>Operator</label>
              <input className={field} value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label}>Shift</label>
                <select className={field} value={shift} onChange={(e) => setShift(e.target.value)}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className={label}>Production date</label>
                <input type="date" className={field} value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
              </div>
            </div>
          </div>
        </MfgCard>

        <MfgCard title="Weights (KG)" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ['Input yarn', inputWeightKg, setInputWeightKg],
              ['Target output', targetOutputKg, setTargetOutputKg],
              ['Actual output', outputWeightKg, setOutputWeightKg],
              ['Wastage', wastageKg, setWastageKg],
              ['Rejected weight', rejectedWeightKg, setRejectedWeightKg],
              ['Remaining yarn', remainingYarnKg, setRemainingYarnKg],
              ['Running hours', runningHours, setRunningHours],
              ['Downtime hours', downtimeHours, setDowntimeHours]
            ].map(([lab, val, setter]) => (
              <div key={String(lab)}>
                <label className={label}>{lab as string}</label>
                <input
                  className={field}
                  value={val as string}
                  onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            ))}
          </div>
          <p className={`mt-3 text-xs font-semibold ${balanceHint.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            Mass balance: input {balanceHint.input} KG vs output+waste+reject+remain {balanceHint.sum} KG
          </p>
        </MfgCard>
      </div>

      <MfgCard
        title="Individual cones"
        action={
          <div className="flex items-center gap-2 text-xs">
            <button type="button" className={`px-2 py-1 rounded-lg ${coneMode === 'equal' ? 'bg-[#014582] text-white' : 'border'}`} onClick={() => setConeMode('equal')}>Equal split</button>
            <button type="button" className={`px-2 py-1 rounded-lg ${coneMode === 'manual' ? 'bg-[#014582] text-white' : 'border'}`} onClick={() => setConeMode('manual')}>Manual weights</button>
          </div>
        }
      >
        {coneMode === 'equal' && (
          <div className="mb-3 max-w-xs">
            <label className={label}>Cone count</label>
            <input className={field} value={coneCount} onChange={(e) => setConeCount(e.target.value)} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#7A8FA6] border-b">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Weight KG</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cones.map((cone, idx) => (
                <tr key={idx} className="border-b border-[#EEF2F7]">
                  <td className="py-2 pr-3">{idx + 1}</td>
                  <td className="py-2 pr-3">
                    <input
                      className={field}
                      value={cone.weightKg}
                      disabled={coneMode === 'equal'}
                      onChange={(e) => {
                        const next = [...cones];
                        next[idx] = { ...next[idx], weightKg: e.target.value };
                        setCones(next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className={field}
                      value={cone.status}
                      onChange={(e) => {
                        const next = [...cones];
                        next[idx] = { ...next[idx], status: e.target.value as 'Available' | 'Rejected' };
                        setCones(next);
                      }}
                    >
                      <option value="Available">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MfgCard>

      <MfgCard>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <label className="flex items-center gap-2 text-sm text-[#1A1A2E] mb-4">
          <input type="checkbox" checked={postNow} onChange={(e) => setPostNow(e.target.checked)} />
          Post immediately (consume yarn LOT + create cone stock + genealogy)
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-xl bg-[#014582] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Saving…' : postNow ? 'Post Cone Winding' : 'Save Draft'}
        </button>
      </MfgCard>
    </MfgPage>
  );
}
