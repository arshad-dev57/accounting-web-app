'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Factory, Plus, X } from 'lucide-react';
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
  MfgTabs,
} from '@/manufacturing/ui';
import {
  fmtQty,
  num,
  textileWeavingService,
  type TextileBeam,
  type TextileDailyLoomProduction,
  type TextileLoom,
  type TextileLoomBeamAllocation,
  type TextileWagesReport,
} from '@/lib/textile-weaving-service';
import { TextileWeavingGate } from '../_components/TextileWeavingGate';
import {
  PrintRegisterButton,
  PrintRegisterChrome,
  PrintSignOff,
  WEAVING_PRINT_STYLES,
} from '../_components/PrintRegisterButton';

function LoomsBody() {
  const [tab, setTab] = useState<'daily' | 'gaiting' | 'wages'>('daily');
  const [looms, setLooms] = useState<TextileLoom[]>([]);
  const [beams, setBeams] = useState<TextileBeam[]>([]);
  const [production, setProduction] = useState<TextileDailyLoomProduction[]>([]);
  const [wages, setWages] = useState<TextileWagesReport | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [wageFrom, setWageFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [wageTo, setWageTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showGaiting, setShowGaiting] = useState(false);
  const [showLoom, setShowLoom] = useState(false);
  const [sheetRows, setSheetRows] = useState<
    Record<
      string,
      {
        shiftAMeters: string;
        shiftBMeters: string;
        gradeAMeters: string;
        gradeBMeters: string;
        gradeCMeters: string;
        remarks: string;
      }
    >
  >({});

  const [gaitingForm, setGaitingForm] = useState({
    loomId: '',
    beamId: '',
    weaverName: '',
    wageRate: '',
    bonusAmount: '',
    totalBeamLengthMeters: '',
  });
  const [loomForm, setLoomForm] = useState({ loomNumber: '', section: 'Sulzer First Part' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [l, b, p] = await Promise.all([
        textileWeavingService.listLooms(),
        textileWeavingService.listBeams(),
        textileWeavingService.listDailyProduction({ date }),
      ]);
      setLooms(l);
      setBeams(b);
      setProduction(p);

      const nextSheet: typeof sheetRows = {};
      for (const loom of l) {
        const existing = p.find((row) => row.loomId === loom.id);
        nextSheet[loom.id] = {
          shiftAMeters: existing ? String(num(existing.shiftAMeters)) : '',
          shiftBMeters: existing ? String(num(existing.shiftBMeters)) : '',
          gradeAMeters: existing ? String(num(existing.gradeAMeters)) : '',
          gradeBMeters: existing ? String(num(existing.gradeBMeters)) : '',
          gradeCMeters: existing ? String(num(existing.gradeCMeters)) : '',
          remarks: existing?.remarks || '',
        };
      }
      setSheetRows(nextSheet);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load loom register');
    } finally {
      setLoading(false);
    }
  }, [date]);

  const loadWages = useCallback(async () => {
    try {
      setWages(await textileWeavingService.wagesReport({ from: wageFrom, to: wageTo }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to load wages');
    }
  }, [wageFrom, wageTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === 'wages') void loadWages();
  }, [tab, loadWages]);

  const activeAllocations = useMemo(() => {
    const map = new Map<string, TextileLoomBeamAllocation>();
    for (const loom of looms) {
      const active = (loom.allocations || []).find((a) => a.status === 'ACTIVE');
      if (active) map.set(loom.id, active);
    }
    return map;
  }, [looms]);

  const warpedBeams = beams.filter(
    (b) => b.weavingStatus === 'WARPING' || b.weavingStatus === 'EMPTY'
  );

  const saveDailySheet = async () => {
    setSaving(true);
    setFormError('');
    try {
      const entries = looms
        .map((loom) => {
          const row = sheetRows[loom.id];
          if (!row) return null;
          const has =
            num(row.shiftAMeters) ||
            num(row.shiftBMeters) ||
            num(row.gradeAMeters) ||
            num(row.gradeBMeters) ||
            num(row.gradeCMeters) ||
            row.remarks;
          if (!has) return null;
          return {
            loomId: loom.id,
            allocationId: activeAllocations.get(loom.id)?.id,
            shiftAMeters: num(row.shiftAMeters),
            shiftBMeters: num(row.shiftBMeters),
            gradeAMeters: num(row.gradeAMeters),
            gradeBMeters: num(row.gradeBMeters),
            gradeCMeters: num(row.gradeCMeters),
            remarks: row.remarks || undefined,
          };
        })
        .filter(Boolean);

      if (!entries.length) throw new Error('Enter at least one loom row (S.A / S.B)');
      await textileWeavingService.postDailyProduction({
        productionDate: date,
        entries,
      });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save daily sheet');
    } finally {
      setSaving(false);
    }
  };

  const createLoom = async () => {
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.createLoom({
        loomNumber: loomForm.loomNumber,
        section: loomForm.section || undefined,
      });
      setShowLoom(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create loom');
    } finally {
      setSaving(false);
    }
  };

  const allocate = async () => {
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.allocateBeam(gaitingForm.loomId, {
        beamId: gaitingForm.beamId,
        weaverName: gaitingForm.weaverName || undefined,
        wageRate: gaitingForm.wageRate ? num(gaitingForm.wageRate) : undefined,
        bonusAmount: gaitingForm.bonusAmount ? num(gaitingForm.bonusAmount) : undefined,
        totalBeamLengthMeters: num(gaitingForm.totalBeamLengthMeters),
      });
      setShowGaiting(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to gait beam');
    } finally {
      setSaving(false);
    }
  };

  const setSheet = (loomId: string, key: string, value: string) => {
    setSheetRows((prev) => ({
      ...prev,
      [loomId]: { ...(prev[loomId] || {
        shiftAMeters: '',
        shiftBMeters: '',
        gradeAMeters: '',
        gradeBMeters: '',
        gradeCMeters: '',
        remarks: '',
      }), [key]: value },
    }));
  };

  return (
    <MfgPage>
      <style dangerouslySetInnerHTML={{ __html: WEAVING_PRINT_STYLES }} />
      <MfgPageHeader
        title="Unit 3: Weaving, Looms & Wages"
        subtitle="Daily sheet · Beam loading (Gaiting) · Karigar wages / Inaam"
        icon={<Factory className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2 no-print">
            {tab === 'daily' && <PrintRegisterButton />}
            {tab === 'daily' && (
              <MfgButton loading={saving} onClick={() => void saveDailySheet()}>
                Save Daily Sheet
              </MfgButton>
            )}
            {tab === 'gaiting' && (
              <>
                <MfgAddButton label="Add Loom" onClick={() => setShowLoom(true)} />
                <MfgAddButton label="Beam Loading (Gaiting)" onClick={() => setShowGaiting(true)} />
              </>
            )}
          </div>
        }
      />

      <div className="no-print">
        <MfgTabs
          tabs={[
            { id: 'daily', label: 'Daily Loom Production Sheet' },
            { id: 'gaiting', label: 'Beam Loading / Gaiting' },
            { id: 'wages', label: 'Karigar Wages & Inaam' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
      </div>

      {formError && (
        <div className="no-print rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {loading ? (
        <MfgCard>
          <MfgLoading />
        </MfgCard>
      ) : error ? (
        <MfgCard>
          <MfgError message={error} />
        </MfgCard>
      ) : tab === 'daily' ? (
        <div className="weaving-print-root space-y-4">
          <PrintRegisterChrome
            title="Daily Loom Production Sheet"
            subtitle={`Date: ${date} · S.A / S.B · Pichla Total · Grade A/B/C`}
          />
          <MfgCard
            title="Daily Loom Production Sheet"
            action={
              <div className="no-print">
                <MfgInput
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-40"
                />
              </div>
            }
          >
            {looms.length === 0 ? (
              <MfgEmpty title="No looms" message="Add looms under Beam Loading / Gaiting." />
            ) : (
              <MfgTable
                columns={[
                  'Loom #',
                  'Beam #',
                  'Karigar (Weaver)',
                  'Shift A (S.A)',
                  'Shift B (S.B)',
                  'Daily Total',
                  'Pichla Total (Cumulative)',
                  'Remaining Beam (m)',
                  'Grade A (Fresh)',
                  'Grade B (Second)',
                  'Grade C (Rejection)',
                  'Remarks / Faults',
                ]}
              >
                {looms.map((loom) => {
                  const alloc = activeAllocations.get(loom.id);
                  const existing = production.find((p) => p.loomId === loom.id);
                  const row = sheetRows[loom.id] || {
                    shiftAMeters: '',
                    shiftBMeters: '',
                    gradeAMeters: '',
                    gradeBMeters: '',
                    gradeCMeters: '',
                    remarks: '',
                  };
                  const daily = num(row.shiftAMeters) + num(row.shiftBMeters);
                  const cumulative = existing
                    ? num(existing.cumulativeBeamMeters)
                    : daily;
                  return (
                    <MfgTableRow key={loom.id}>
                      <MfgTableCell className="font-semibold text-[#014582]">
                        {loom.loomNumber}
                      </MfgTableCell>
                      <MfgTableCell>
                        {alloc?.beam?.beamNumber ||
                          alloc?.beam?.beamCode ||
                          loom.currentBeams?.[0]?.beamNumber ||
                          '—'}
                      </MfgTableCell>
                      <MfgTableCell>{alloc?.weaverName || '—'}</MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          type="number"
                          step="0.01"
                          className="w-20 no-print"
                          value={row.shiftAMeters}
                          onChange={(e) => setSheet(loom.id, 'shiftAMeters', e.target.value)}
                        />
                        <span className="hidden print:inline">{fmtQty(row.shiftAMeters)}</span>
                      </MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          type="number"
                          step="0.01"
                          className="w-20 no-print"
                          value={row.shiftBMeters}
                          onChange={(e) => setSheet(loom.id, 'shiftBMeters', e.target.value)}
                        />
                        <span className="hidden print:inline">{fmtQty(row.shiftBMeters)}</span>
                      </MfgTableCell>
                      <MfgTableCell className="font-semibold">{fmtQty(daily)}</MfgTableCell>
                      <MfgTableCell>{fmtQty(cumulative)}</MfgTableCell>
                      <MfgTableCell>
                        {alloc ? fmtQty(alloc.remainingLengthMeters) : '—'}
                      </MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          type="number"
                          step="0.01"
                          className="w-20 no-print"
                          value={row.gradeAMeters}
                          onChange={(e) => setSheet(loom.id, 'gradeAMeters', e.target.value)}
                        />
                        <span className="hidden print:inline">{fmtQty(row.gradeAMeters)}</span>
                      </MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          type="number"
                          step="0.01"
                          className="w-20 no-print"
                          value={row.gradeBMeters}
                          onChange={(e) => setSheet(loom.id, 'gradeBMeters', e.target.value)}
                        />
                        <span className="hidden print:inline">{fmtQty(row.gradeBMeters)}</span>
                      </MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          type="number"
                          step="0.01"
                          className="w-20 no-print"
                          value={row.gradeCMeters}
                          onChange={(e) => setSheet(loom.id, 'gradeCMeters', e.target.value)}
                        />
                        <span className="hidden print:inline">{fmtQty(row.gradeCMeters)}</span>
                      </MfgTableCell>
                      <MfgTableCell>
                        <MfgInput
                          className="min-w-[140px] no-print"
                          value={row.remarks}
                          onChange={(e) => setSheet(loom.id, 'remarks', e.target.value)}
                          placeholder="Blade fault / downtime"
                        />
                        <span className="hidden print:inline">{row.remarks || '—'}</span>
                      </MfgTableCell>
                    </MfgTableRow>
                  );
                })}
              </MfgTable>
            )}
          </MfgCard>
          <PrintSignOff />
        </div>
      ) : tab === 'gaiting' ? (
        <MfgCard title="Beam Loading / Gaiting">
          {looms.length === 0 ? (
            <MfgEmpty title="No looms yet" message="Add loom numbers (K-17, M-2, 65–79)." />
          ) : (
            <MfgTable
              columns={[
                'Loom #',
                'Section',
                'Beam #',
                'Taar (Ends)',
                'Beam Length (m)',
                'Karigar (Weaver)',
                'Rate',
                'Inaam (Bonus)',
                'Remaining (m)',
                'Status',
              ]}
            >
              {looms.map((loom) => {
                const alloc = activeAllocations.get(loom.id);
                return (
                  <MfgTableRow key={loom.id}>
                    <MfgTableCell className="font-semibold text-[#014582]">
                      {loom.loomNumber}
                    </MfgTableCell>
                    <MfgTableCell>{loom.section || '—'}</MfgTableCell>
                    <MfgTableCell>
                      {alloc?.beam?.beamNumber || alloc?.beam?.beamCode || '—'}
                    </MfgTableCell>
                    <MfgTableCell>{alloc?.beam?.totalEnds ?? '—'}</MfgTableCell>
                    <MfgTableCell>
                      {alloc ? fmtQty(alloc.totalBeamLengthMeters) : '—'}
                    </MfgTableCell>
                    <MfgTableCell>{alloc?.weaverName || '—'}</MfgTableCell>
                    <MfgTableCell>
                      {alloc?.wageRate != null ? fmtQty(alloc.wageRate) : '—'}
                    </MfgTableCell>
                    <MfgTableCell>
                      {alloc?.bonusAmount != null ? fmtQty(alloc.bonusAmount) : '—'}
                    </MfgTableCell>
                    <MfgTableCell>
                      {alloc ? fmtQty(alloc.remainingLengthMeters) : '—'}
                    </MfgTableCell>
                    <MfgTableCell>{loom.status}</MfgTableCell>
                  </MfgTableRow>
                );
              })}
            </MfgTable>
          )}
        </MfgCard>
      ) : (
        <MfgCard
          title="Karigar Wages & Inaam"
          action={
            <div className="flex flex-wrap items-end gap-2">
              <MfgInput
                type="date"
                value={wageFrom}
                onChange={(e) => setWageFrom(e.target.value)}
                className="w-36"
              />
              <MfgInput
                type="date"
                value={wageTo}
                onChange={(e) => setWageTo(e.target.value)}
                className="w-36"
              />
              <MfgButton variant="secondary" onClick={() => void loadWages()}>
                Refresh
              </MfgButton>
            </div>
          }
        >
          {!wages || wages.weavers.length === 0 ? (
            <MfgEmpty title="No wage rows" message="Enter daily production against gaited beams first." />
          ) : (
            <>
              <MfgTable
                columns={[
                  'Karigar (Weaver)',
                  'Looms',
                  'Total Meters',
                  'Rate',
                  'Wages Amount',
                  'Inaam (Bonus)',
                  'Net Payable',
                ]}
              >
                {wages.weavers.map((row) => (
                  <MfgTableRow key={`${row.weaverName}-${row.wageRate}`}>
                    <MfgTableCell className="font-semibold">{row.weaverName}</MfgTableCell>
                    <MfgTableCell>{row.loomCount}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.totalMeters)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.wageRate)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.meterWageAmount)}</MfgTableCell>
                    <MfgTableCell>{fmtQty(row.bonusAmount)}</MfgTableCell>
                    <MfgTableCell className="font-bold text-[#014582]">
                      {fmtQty(row.totalPayable)}
                    </MfgTableCell>
                  </MfgTableRow>
                ))}
              </MfgTable>
              <p className="mt-3 text-sm font-semibold text-[#1A1A2E]">
                Total meters {fmtQty(wages.totals.totalMeters)} · Net payable{' '}
                {fmtQty(wages.totals.totalPayable)}
              </p>
            </>
          )}
        </MfgCard>
      )}

      {showLoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold">Add Loom</h3>
              <button type="button" onClick={() => setShowLoom(false)}>
                <X className="h-4 w-4 text-[#7A8FA6]" />
              </button>
            </div>
            <div className="grid gap-3 p-5">
              <MfgField label="Loom #">
                <MfgInput
                  value={loomForm.loomNumber}
                  onChange={(e) => setLoomForm((f) => ({ ...f, loomNumber: e.target.value }))}
                  placeholder="K-17 / M-2 / 65"
                />
              </MfgField>
              <MfgField label="Section">
                <MfgInput
                  value={loomForm.section}
                  onChange={(e) => setLoomForm((f) => ({ ...f, section: e.target.value }))}
                  placeholder="Sulzer First Part"
                />
              </MfgField>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#DDE4EE] px-5 py-4">
              <MfgButton variant="secondary" onClick={() => setShowLoom(false)}>
                Cancel
              </MfgButton>
              <MfgButton loading={saving} onClick={() => void createLoom()}>
                <Plus className="h-4 w-4" /> Save Loom
              </MfgButton>
            </div>
          </div>
        </div>
      )}

      {showGaiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold">Beam Loading / Gaiting</h3>
              <button type="button" onClick={() => setShowGaiting(false)}>
                <X className="h-4 w-4 text-[#7A8FA6]" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <MfgField label="Loom #">
                <MfgSelect
                  value={gaitingForm.loomId}
                  onChange={(e) => setGaitingForm((f) => ({ ...f, loomId: e.target.value }))}
                >
                  <option value="">Select loom…</option>
                  {looms.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loomNumber} {l.section ? `· ${l.section}` : ''}
                    </option>
                  ))}
                </MfgSelect>
              </MfgField>
              <MfgField label="Beam #">
                <MfgSelect
                  value={gaitingForm.beamId}
                  onChange={(e) => {
                    const beam = beams.find((b) => b.id === e.target.value);
                    setGaitingForm((f) => ({
                      ...f,
                      beamId: e.target.value,
                      totalBeamLengthMeters:
                        beam?.yarnLengthM != null
                          ? String(beam.yarnLengthM)
                          : f.totalBeamLengthMeters,
                    }));
                  }}
                >
                  <option value="">Select warped beam…</option>
                  {warpedBeams.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.beamNumber || b.beamCode} ({b.weavingStatus})
                    </option>
                  ))}
                </MfgSelect>
              </MfgField>
              <MfgField label="Karigar (Weaver)">
                <MfgInput
                  value={gaitingForm.weaverName}
                  onChange={(e) => setGaitingForm((f) => ({ ...f, weaverName: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Beam Length (m)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={gaitingForm.totalBeamLengthMeters}
                  onChange={(e) =>
                    setGaitingForm((f) => ({ ...f, totalBeamLengthMeters: e.target.value }))
                  }
                />
              </MfgField>
              <MfgField label="Rate">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={gaitingForm.wageRate}
                  onChange={(e) => setGaitingForm((f) => ({ ...f, wageRate: e.target.value }))}
                  placeholder="250 / 280"
                />
              </MfgField>
              <MfgField label="Inaam (Bonus)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={gaitingForm.bonusAmount}
                  onChange={(e) => setGaitingForm((f) => ({ ...f, bonusAmount: e.target.value }))}
                  placeholder="1500"
                />
              </MfgField>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#DDE4EE] px-5 py-4">
              <MfgButton variant="secondary" onClick={() => setShowGaiting(false)}>
                Cancel
              </MfgButton>
              <MfgButton loading={saving} onClick={() => void allocate()}>
                Load Beam (Gait)
              </MfgButton>
            </div>
          </div>
        </div>
      )}
    </MfgPage>
  );
}

export default function WeavingLoomsPage() {
  return (
    <TextileWeavingGate title="Unit 3: Looms & Wages" subtitle="Daily sheet · Gaiting · Inaam">
      <LoomsBody />
    </TextileWeavingGate>
  );
}
