'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Plus, X } from 'lucide-react';
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
  type TextileGodownLedger,
  type TextileYarnStock,
} from '@/lib/textile-weaving-service';
import { TextileWeavingGate } from '../_components/TextileWeavingGate';
import {
  PrintRegisterButton,
  PrintRegisterChrome,
  PrintSignOff,
  WEAVING_PRINT_STYLES,
} from '../_components/PrintRegisterButton';

function ChallanBadge({ prefix }: { prefix: string }) {
  const isDb = prefix === 'DB';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isDb ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
      }`}
      title={isDb ? 'DB = Market Receipt (Rec From Market)' : 'P = Production Issue'}
    >
      {prefix}
    </span>
  );
}

function GodownBody() {
  const searchParams = useSearchParams();
  const [stocks, setStocks] = useState<TextileYarnStock[]>([]);
  const [ledger, setLedger] = useState<TextileGodownLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [article, setArticle] = useState('');
  const [lot, setLot] = useState('');
  const [prefix, setPrefix] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    challanPrefix: 'DB',
    challanNumber: '',
    entryDate: new Date().toISOString().slice(0, 10),
    partyName: '',
    articleCount: '',
    brand: '',
    lotNumber: '',
    cartons: '',
    weightKg: '',
    kgPerCarton: '32',
    remarks: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l] = await Promise.all([
        textileWeavingService.listStocks({
          articleCount: article || undefined,
          lotNumber: lot || undefined,
        }),
        textileWeavingService.listLedger({
          articleCount: article || undefined,
          lotNumber: lot || undefined,
          challanPrefix: prefix || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      ]);
      setStocks(s);
      setLedger(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load godown');
    } finally {
      setLoading(false);
    }
  }, [article, lot, prefix, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const kgPer = num(form.kgPerCarton, 32);
    const ctn = form.cartons;
    if (ctn === '') return;
    const cartons = num(ctn);
    setForm((f) => ({ ...f, weightKg: String(Math.round(cartons * kgPer * 10000) / 10000) }));
    // intentionally only when cartons / kgPer change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cartons, form.kgPerCarton]);

  const stockRows = useMemo(
    () =>
      [...stocks].sort(
        (a, b) =>
          a.articleCount.localeCompare(b.articleCount) ||
          a.brand.localeCompare(b.brand) ||
          a.lotNumber.localeCompare(b.lotNumber)
      ),
    [stocks]
  );

  const submit = async () => {
    setSaving(true);
    setFormError('');
    try {
      const body: Record<string, unknown> = {
        challanPrefix: form.challanPrefix,
        challanNumber: form.challanNumber || undefined,
        entryDate: form.entryDate,
        partyName: form.partyName || undefined,
        articleCount: form.articleCount,
        brand: form.brand,
        lotNumber: form.lotNumber,
        kgPerCarton: num(form.kgPerCarton, 32),
        remarks: form.remarks || undefined,
      };
      if (form.challanPrefix === 'DB') {
        body.inCartons = num(form.cartons);
        body.inWeightKg = num(form.weightKg);
      } else {
        body.outCartons = num(form.cartons);
        body.outWeightKg = num(form.weightKg);
      }
      await textileWeavingService.postLedger(body);
      setShowModal(false);
      setForm((f) => ({
        ...f,
        challanNumber: '',
        partyName: '',
        articleCount: '',
        brand: '',
        lotNumber: '',
        cartons: '',
        weightKg: '',
        remarks: '',
      }));
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <style dangerouslySetInnerHTML={{ __html: WEAVING_PRINT_STYLES }} />
      <MfgPageHeader
        title="Yarn Godown Register"
        subtitle="Stock register — DB (Rec From Market) / P (Production Issue)"
        icon={<Package className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2 no-print">
            <PrintRegisterButton />
            <MfgAddButton label="New CH Entry" onClick={() => setShowModal(true)} />
          </div>
        }
      />

      <div className="weaving-print-root space-y-4">
        <PrintRegisterChrome
          title="Yarn Godown Register (Godown Stock Register)"
          subtitle="DB = Market Receipt · P = Production Issue"
        />

        <MfgCard title="Lot-wise stock (Article / Brand / Lot #)">
          {loading ? (
            <MfgLoading />
          ) : error ? (
            <MfgError message={error} />
          ) : stockRows.length === 0 ? (
            <MfgEmpty
              title="No yarn stock yet"
              message="Record a DB challan (Rec From Market) to open a lot."
            />
          ) : (
            <MfgTable
              columns={[
                'Article',
                'Brand',
                'Lot #',
                'Balance (CTN)',
                'Balance (Weight KG)',
                'KG per CTN',
              ]}
            >
              {stockRows.map((row) => (
                <MfgTableRow key={row.id}>
                  <MfgTableCell className="font-semibold text-[#014582]">{row.articleCount}</MfgTableCell>
                  <MfgTableCell>{row.brand || '—'}</MfgTableCell>
                  <MfgTableCell>{row.lotNumber}</MfgTableCell>
                  <MfgTableCell>{fmtQty(row.balanceCartons)}</MfgTableCell>
                  <MfgTableCell>{fmtQty(row.balanceWeightKg)}</MfgTableCell>
                  <MfgTableCell>{fmtQty(row.kgPerCarton)}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>

        <MfgCard
          title="Godown ledger (CH Register)"
          action={
            <div className="flex flex-wrap items-end gap-2 no-print">
              <MfgInput
                placeholder="Article"
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                className="w-28"
              />
              <MfgInput
                placeholder="Lot #"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-28"
              />
              <MfgSelect value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-28">
                <option value="">All CH</option>
                <option value="DB">DB (Market)</option>
                <option value="P">P (Issue)</option>
              </MfgSelect>
              <MfgInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
              <MfgInput type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
            </div>
          }
        >
          {loading ? (
            <MfgLoading />
          ) : ledger.length === 0 ? (
            <MfgEmpty title="No ledger lines" />
          ) : (
            <MfgTable
              columns={[
                'Date',
                'CH #',
                'Party / Detail',
                'Article',
                'Brand',
                'Lot #',
                'IN (CTN / Weight KG)',
                'OUT (CTN / Weight KG)',
                'Balance (CTN / Weight KG)',
              ]}
            >
              {ledger.map((row) => (
                <MfgTableRow key={row.id}>
                  <MfgTableCell>
                    {row.entryDate ? new Date(row.entryDate).toLocaleDateString() : '—'}
                  </MfgTableCell>
                  <MfgTableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <ChallanBadge prefix={row.challanPrefix} />
                      <span className="font-semibold">{row.challanNumber}</span>
                    </span>
                  </MfgTableCell>
                  <MfgTableCell>{row.partyName || row.supplier?.name || '—'}</MfgTableCell>
                  <MfgTableCell className="font-medium">{row.articleCount}</MfgTableCell>
                  <MfgTableCell>{row.brand || '—'}</MfgTableCell>
                  <MfgTableCell>{row.lotNumber}</MfgTableCell>
                  <MfgTableCell>
                    {fmtQty(row.inCartons)} / {fmtQty(row.inWeightKg)}
                  </MfgTableCell>
                  <MfgTableCell>
                    {fmtQty(row.outCartons)} / {fmtQty(row.outWeightKg)}
                  </MfgTableCell>
                  <MfgTableCell className="font-semibold">
                    {fmtQty(row.balanceCartons)} / {fmtQty(row.balanceWeightKg)}
                  </MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
        <PrintSignOff />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold text-[#1A1A2E]">Godown CH Entry</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#7A8FA6]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <MfgField label="Challan Type (DB - Rec From Market / P - Production Issue)">
                <MfgSelect
                  value={form.challanPrefix}
                  onChange={(e) => setForm((f) => ({ ...f, challanPrefix: e.target.value }))}
                >
                  <option value="DB">DB — Rec From Market (Inward)</option>
                  <option value="P">P — Production Issue (Outward)</option>
                </MfgSelect>
              </MfgField>
              <MfgField label="CH # (optional)">
                <MfgInput
                  value={form.challanNumber}
                  onChange={(e) => setForm((f) => ({ ...f, challanNumber: e.target.value }))}
                  placeholder="Auto if blank"
                />
              </MfgField>
              <MfgField label="Date">
                <MfgInput
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Party / Detail">
                <MfgInput
                  value={form.partyName}
                  onChange={(e) => setForm((f) => ({ ...f, partyName: e.target.value }))}
                  placeholder="e.g. Market / Naufil Twisting"
                />
              </MfgField>
              <MfgField label="Article">
                <MfgInput
                  value={form.articleCount}
                  onChange={(e) => setForm((f) => ({ ...f, articleCount: e.target.value }))}
                  placeholder="50/24/0"
                />
              </MfgField>
              <MfgField label="Brand">
                <MfgInput
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="Tongkun"
                />
              </MfgField>
              <MfgField label="Lot #">
                <MfgInput
                  value={form.lotNumber}
                  onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value }))}
                  placeholder="0530241"
                />
              </MfgField>
              <MfgField label="KG per CTN (Default 32)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.kgPerCarton}
                  onChange={(e) => setForm((f) => ({ ...f, kgPerCarton: e.target.value }))}
                />
              </MfgField>
              <MfgField label="CTN (Cartons)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.cartons}
                  onChange={(e) => setForm((f) => ({ ...f, cartons: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Total Weight (KG)" hint="Auto = CTN × KG per CTN (editable)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                />
              </MfgField>
              <div className="sm:col-span-2">
                <MfgField label="Remarks / Detail">
                  <MfgInput
                    value={form.remarks}
                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </MfgField>
              </div>
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
                <Plus className="h-4 w-4" /> Save CH
              </MfgButton>
            </div>
          </div>
        </div>
      )}
    </MfgPage>
  );
}

export default function WeavingGodownPage() {
  return (
    <TextileWeavingGate title="Yarn Godown" subtitle="Stock & challan register">
      <Suspense
        fallback={
          <MfgPage>
            <MfgCard>
              <MfgLoading />
            </MfgCard>
          </MfgPage>
        }
      >
        <GodownBody />
      </Suspense>
    </TextileWeavingGate>
  );
}
