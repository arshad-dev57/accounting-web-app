'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import {
  MfgAddButton,
  MfgButton,
  MfgCard,
  MfgEmpty,
  MfgError,
  MfgField,
  MfgInput,
  MfgLoading,
  MfgPage,
  MfgPageHeader,
  MfgSelect,
  MfgTable,
  MfgTableCell,
  MfgTableRow,
} from '@/manufacturing/ui';
import {
  fmtQty,
  num,
  textileWeavingService,
  type TextileBeam,
  type TextileWarpingSet,
} from '@/lib/textile-weaving-service';
import { TextileWeavingGate } from '../_components/TextileWeavingGate';
import {
  PrintRegisterButton,
  PrintRegisterChrome,
  PrintSignOff,
  WEAVING_PRINT_STYLES,
} from '../_components/PrintRegisterButton';

function WastageCell({ kg, total }: { kg: number; total: number }) {
  const pct = total > 0 ? Math.round((kg / total) * 10000) / 100 : 0;
  const high = pct > 2.5;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{fmtQty(kg)} KG</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          high ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {fmtQty(pct)}%
      </span>
    </span>
  );
}

function WarpingBody() {
  const [sets, setSets] = useState<TextileWarpingSet[]>([]);
  const [beams, setBeams] = useState<TextileBeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    warpingDate: new Date().toISOString().slice(0, 10),
    setNumber: '',
    beamId: '',
    beamNumber: '',
    newBeamNumber: '',
    machineCode: 'A-31',
    endsCount: '',
    lengthMeters: '',
    reedWidth: '',
    netBeamWeightKg: '',
    conesConsumedSKg: '',
    conesConsumedZKg: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, b] = await Promise.all([
        textileWeavingService.listWarpingSets(),
        textileWeavingService.listBeams(),
      ]);
      setSets(s);
      setBeams(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load warping register');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setFormError('');
    try {
      let beamId = form.beamId;
      let beamNumber = form.beamNumber;
      if (!beamId && form.newBeamNumber.trim()) {
        const beam = await textileWeavingService.createBeam({
          beamNumber: form.newBeamNumber.trim(),
          weavingStatus: 'EMPTY',
        });
        beamId = beam.id;
        beamNumber = beam.beamNumber || beam.beamCode;
      }
      if (!beamId) throw new Error('Select or create a Beam #');

      await textileWeavingService.createWarpingSet({
        beamId,
        beamNumber: beamNumber || form.newBeamNumber,
        setNumber: form.setNumber || undefined,
        machineCode: form.machineCode || undefined,
        warpingDate: form.warpingDate,
        endsCount: parseInt(form.endsCount, 10) || 0,
        lengthMeters: num(form.lengthMeters),
        reedWidth: form.reedWidth ? num(form.reedWidth) : undefined,
        netBeamWeightKg: num(form.netBeamWeightKg),
        conesConsumedSKg: num(form.conesConsumedSKg),
        conesConsumedZKg: num(form.conesConsumedZKg),
      });
      setShowModal(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save warping set');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <style dangerouslySetInnerHTML={{ __html: WEAVING_PRINT_STYLES }} />
      <MfgPageHeader
        title="Unit 2: Warping Register (Beams)"
        subtitle="Set # · Beam # · Taar · Pana · S/Z twist · Wastage"
        icon={<Layers className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2 no-print">
            <PrintRegisterButton />
            <MfgAddButton label="New Warping Set" onClick={() => setShowModal(true)} />
          </div>
        }
      />

      <div className="weaving-print-root space-y-4">
        <PrintRegisterChrome
          title="Warping Register (Page 5)"
          subtitle="Taar (Ends) · Length · Pana (Reed) · S/Z Twist Weight · Beam Net · Wastage"
        />

        <MfgCard title="Warping sets">
          {loading ? (
            <MfgLoading />
          ) : error ? (
            <MfgError message={error} />
          ) : sets.length === 0 ? (
            <MfgEmpty title="No warping sets" message="Create a set against a Beam # (e.g. 212, B-93)." />
          ) : (
            <MfgTable
              columns={[
                'Date',
                'Set #',
                'Beam #',
                'Machine',
                'Taar (Ends)',
                'Length (Meters)',
                'Pana (Reed)',
                'S-Twist Weight (KG)',
                'Z-Twist Weight (KG)',
                'Total Yarn (KG)',
                'Beam Net Weight (KG)',
                'Wastage (KG & %)',
              ]}
            >
              {sets.map((row) => {
                const total = num(row.totalYarnConsumedKg);
                const wastage = num(row.warpingWastageKg);
                return (
                  <MfgTableRow key={row.id}>
                    <MfgTableCell>
                      {row.warpingDate ? new Date(row.warpingDate).toLocaleDateString() : '—'}
                    </MfgTableCell>
                    <MfgTableCell className="font-semibold text-[#014582]">{row.setNumber}</MfgTableCell>
                    <MfgTableCell className="font-medium">
                      {row.beamNumber || row.beam?.beamNumber || row.beam?.beamCode || '—'}
                    </MfgTableCell>
                    <MfgTableCell>{row.machineCode || '—'}</MfgTableCell>
                    <MfgTableCell>{row.endsCount}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.lengthMeters)}</MfgTableCell>
                    <MfgTableCell>{row.reedWidth != null ? fmtQty(row.reedWidth) : '—'}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.conesConsumedSKg)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.conesConsumedZKg)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(total)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.netBeamWeightKg)}</MfgTableCell>
                    <MfgTableCell>
                      <WastageCell kg={wastage} total={total} />
                    </MfgTableCell>
                  </MfgTableRow>
                );
              })}
            </MfgTable>
          )}
        </MfgCard>
        <PrintSignOff />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold">New Warping Set</h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 text-[#7A8FA6]" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <MfgField label="Date">
                <MfgInput
                  type="date"
                  value={form.warpingDate}
                  onChange={(e) => setForm((f) => ({ ...f, warpingDate: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Set # (optional)">
                <MfgInput
                  value={form.setNumber}
                  onChange={(e) => setForm((f) => ({ ...f, setNumber: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Existing Beam #">
                <MfgSelect
                  value={form.beamId}
                  onChange={(e) => {
                    const beam = beams.find((b) => b.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      beamId: e.target.value,
                      beamNumber: beam?.beamNumber || beam?.beamCode || '',
                      newBeamNumber: '',
                    }));
                  }}
                >
                  <option value="">Select beam…</option>
                  {beams.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.beamNumber || b.beamCode} ({b.weavingStatus || b.status})
                    </option>
                  ))}
                </MfgSelect>
              </MfgField>
              <MfgField label="Or new Beam #">
                <MfgInput
                  value={form.newBeamNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newBeamNumber: e.target.value, beamId: '' }))
                  }
                  placeholder="212 / B-93"
                />
              </MfgField>
              <MfgField label="Machine">
                <MfgInput
                  value={form.machineCode}
                  onChange={(e) => setForm((f) => ({ ...f, machineCode: e.target.value }))}
                  placeholder="A-31"
                />
              </MfgField>
              <MfgField label="Taar (Ends)">
                <MfgInput
                  type="number"
                  value={form.endsCount}
                  onChange={(e) => setForm((f) => ({ ...f, endsCount: e.target.value }))}
                  placeholder="5376 / 12200"
                />
              </MfgField>
              <MfgField label="Length (Meters)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.lengthMeters}
                  onChange={(e) => setForm((f) => ({ ...f, lengthMeters: e.target.value }))}
                  placeholder="5250"
                />
              </MfgField>
              <MfgField label="Pana (Reed)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.reedWidth}
                  onChange={(e) => setForm((f) => ({ ...f, reedWidth: e.target.value }))}
                  placeholder="190"
                />
              </MfgField>
              <MfgField label="S-Twist Weight (KG)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.conesConsumedSKg}
                  onChange={(e) => setForm((f) => ({ ...f, conesConsumedSKg: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Z-Twist Weight (KG)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.conesConsumedZKg}
                  onChange={(e) => setForm((f) => ({ ...f, conesConsumedZKg: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Beam Net Weight (KG)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.netBeamWeightKg}
                  onChange={(e) => setForm((f) => ({ ...f, netBeamWeightKg: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Total Yarn (KG)" hint="Auto = S + Z">
                <MfgInput
                  readOnly
                  value={fmtQty(num(form.conesConsumedSKg) + num(form.conesConsumedZKg))}
                />
              </MfgField>
            </div>
            {formError && (
              <p className="mx-5 mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-[#DDE4EE] px-5 py-4">
              <MfgButton variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </MfgButton>
              <MfgButton loading={saving} onClick={() => void submit()}>
                <Plus className="h-4 w-4" /> Save Warping Set
              </MfgButton>
            </div>
          </div>
        </div>
      )}
    </MfgPage>
  );
}

export default function WeavingWarpingPage() {
  return (
    <TextileWeavingGate title="Unit 2: Warping Register" subtitle="Beams · Taar · Pana">
      <WarpingBody />
    </TextileWeavingGate>
  );
}
