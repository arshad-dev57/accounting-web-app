'use client';

import { Fragment, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus, Scissors, X } from 'lucide-react';
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
  MfgStatusBadge,
  MfgTable,
  MfgTableCell,
  MfgTableRow,
  MfgTabs,
} from '@/manufacturing/ui';
import {
  fmtQty,
  num,
  textileWeavingService,
  type TextileTwistingBatch,
  type TextileWeftIssue,
  type TextileYarnStock,
} from '@/lib/textile-weaving-service';
import { TextileWeavingGate } from '../_components/TextileWeavingGate';

function WastageBadge({ percent }: { percent: number }) {
  const high = percent > 2.5;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        high ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {fmtQty(percent)}%
    </span>
  );
}

function TwistingBody() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'batches' | 'weft'>('batches');
  const [batches, setBatches] = useState<TextileTwistingBatch[]>([]);
  const [weftIssues, setWeftIssues] = useState<TextileWeftIssue[]>([]);
  const [stocks, setStocks] = useState<TextileYarnStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(searchParams.get('newBatch') === '1');
  const [showWeftModal, setShowWeftModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [batchForm, setBatchForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    machineCode: '',
    vendorName: '',
    inputArticleCount: '50/24/0',
    inputBrand: '',
    inputLotNumber: '',
    issuedCartons: '',
    kgPerCarton: '32',
    notes: '',
  });

  const [receiptForms, setReceiptForms] = useState<
    Record<
      string,
      {
        receiptDate: string;
        outputArticleCount: string;
        outputBrand: string;
        outputLotNumber: string;
        cartons: string;
        conesCount: string;
        actualNetWeightKg: string;
        twistDirection: string;
        billNumber: string;
      }
    >
  >({});

  const [completeBill, setCompleteBill] = useState<Record<string, string>>({});

  const [weftForm, setWeftForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    articleCount: '',
    brand: '',
    lotNumber: '',
    twistDirection: 'S',
    issuedCartons: '',
    issuedCones: '',
    issuedNetWeightKg: '',
    section: '',
    remarks: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, w, s] = await Promise.all([
        textileWeavingService.listBatches(),
        textileWeavingService.listWeftIssues(),
        textileWeavingService.listStocks(),
      ]);
      setBatches(b);
      setWeftIssues(w);
      setStocks(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load twisting data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const receiptForm = (batchId: string) =>
    receiptForms[batchId] || {
      receiptDate: new Date().toISOString().slice(0, 10),
      outputArticleCount: '50/24/3200',
      outputBrand: '',
      outputLotNumber: '',
      cartons: '',
      conesCount: '',
      actualNetWeightKg: '',
      twistDirection: 'S',
      billNumber: '',
    };

  const setReceiptField = (batchId: string, key: string, value: string) => {
    setReceiptForms((prev) => ({
      ...prev,
      [batchId]: { ...receiptForm(batchId), [key]: value },
    }));
  };

  const createBatch = async () => {
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.createBatch({
        issueDate: batchForm.issueDate,
        machineCode: batchForm.machineCode || undefined,
        vendorName: batchForm.vendorName || undefined,
        inputArticleCount: batchForm.inputArticleCount,
        inputBrand: batchForm.inputBrand,
        inputLotNumber: batchForm.inputLotNumber,
        issuedCartons: num(batchForm.issuedCartons),
        kgPerCarton: num(batchForm.kgPerCarton, 32),
        notes: batchForm.notes || undefined,
      });
      setShowBatchModal(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create batch');
    } finally {
      setSaving(false);
    }
  };

  const addReceipt = async (batchId: string) => {
    const form = receiptForm(batchId);
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.addReceipt(batchId, {
        receiptDate: form.receiptDate,
        outputArticleCount: form.outputArticleCount,
        outputBrand: form.outputBrand,
        outputLotNumber: form.outputLotNumber || undefined,
        cartons: num(form.cartons),
        conesCount: parseInt(form.conesCount, 10) || 0,
        actualNetWeightKg: num(form.actualNetWeightKg),
        twistDirection: form.twistDirection,
        billNumber: form.billNumber || undefined,
      });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to add receipt');
    } finally {
      setSaving(false);
    }
  };

  const completeBatch = async (batchId: string) => {
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.completeBatch(batchId, {
        billNumber: completeBill[batchId] || undefined,
      });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to complete batch');
    } finally {
      setSaving(false);
    }
  };

  const createWeft = async () => {
    setSaving(true);
    setFormError('');
    try {
      await textileWeavingService.createWeftIssue({
        issueDate: weftForm.issueDate,
        articleCount: weftForm.articleCount,
        brand: weftForm.brand,
        lotNumber: weftForm.lotNumber,
        twistDirection: weftForm.twistDirection,
        issuedCartons: num(weftForm.issuedCartons),
        issuedCones: parseInt(weftForm.issuedCones, 10) || 0,
        issuedNetWeightKg: num(weftForm.issuedNetWeightKg),
        section: weftForm.section || undefined,
        remarks: weftForm.remarks || undefined,
      });
      setShowWeftModal(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to issue weft');
    } finally {
      setSaving(false);
    }
  };

  const fillFromStock = (stockId: string, target: 'batch' | 'weft') => {
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return;
    if (target === 'batch') {
      setBatchForm((f) => ({
        ...f,
        inputArticleCount: stock.articleCount,
        inputBrand: stock.brand,
        inputLotNumber: stock.lotNumber,
        kgPerCarton: String(num(stock.kgPerCarton, 32)),
      }));
    } else {
      setWeftForm((f) => ({
        ...f,
        articleCount: stock.articleCount,
        brand: stock.brand,
        lotNumber: stock.lotNumber,
      }));
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title="Unit 1: Twisting & Coning"
        subtitle="Issue yarn → receive cones → wastage / Bill # · Direct Weft (Bana)"
        icon={<Scissors className="w-5 h-5 text-white" />}
        actions={
          tab === 'batches' ? (
            <MfgAddButton label="Issue Batch / CH" onClick={() => setShowBatchModal(true)} />
          ) : (
            <MfgAddButton label="Weft Issue (Bana)" onClick={() => setShowWeftModal(true)} />
          )
        }
      />

      <MfgTabs
        tabs={[
          { id: 'batches', label: 'Twisting / Coning Register', count: batches.length },
          { id: 'weft', label: 'Direct Weft Issue (Bana to Unit 3)', count: weftIssues.length },
        ]}
        active={tab}
        onChange={(id) => setTab(id as 'batches' | 'weft')}
      />

      {formError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
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
      ) : tab === 'batches' ? (
        <MfgCard title="Twisting / Coning Register">
          {batches.length === 0 ? (
            <MfgEmpty
              title="No twisting batches"
              message="Issue raw yarn (e.g. 50/24/0) from Godown to Machine / Party."
            />
          ) : (
            <div className="space-y-2">
              <MfgTable
                columns={[
                  '',
                  'Date',
                  'Batch / CH #',
                  'Machine / Party',
                  'Input Article & Lot #',
                  'Issued CTN',
                  'Issued Weight (KG)',
                  'Received CTN',
                  'Cones',
                  'Net Weight (KG)',
                  'Twist (S / Z)',
                  'Wastage (KG & %)',
                  'Bill #',
                  'Status',
                ]}
              >
                {batches.map((batch) => {
                  const open = expanded === batch.id;
                  const bill =
                    batch.receipts?.find((r) => r.billNumber)?.billNumber || '—';
                  const machineVendor =
                    [batch.machineCode, batch.vendorName || batch.vendor?.name]
                      .filter(Boolean)
                      .join(' · ') || '—';
                  const receipts = batch.receipts || [];
                  const receivedCtn = receipts.reduce((s, r) => s + num(r.cartons), 0);
                  const cones = receipts.reduce((s, r) => s + num(r.conesCount), 0);
                  const twists = [...new Set(receipts.map((r) => r.twistDirection).filter(Boolean))]
                    .join(' / ') || '—';
                  return (
                    <Fragment key={batch.id}>
                      <MfgTableRow onClick={() => setExpanded(open ? null : batch.id)}>
                        <MfgTableCell>
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-[#7A8FA6]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#7A8FA6]" />
                          )}
                        </MfgTableCell>
                        <MfgTableCell>
                          {batch.issueDate ? new Date(batch.issueDate).toLocaleDateString() : '—'}
                        </MfgTableCell>
                        <MfgTableCell className="font-semibold text-[#014582]">
                          {batch.batchNumber}
                        </MfgTableCell>
                        <MfgTableCell>{machineVendor}</MfgTableCell>
                        <MfgTableCell>
                          <div className="font-medium">{batch.inputArticleCount}</div>
                          <div className="text-[11px] text-[#7A8FA6]">
                            {batch.inputBrand || '—'} · Lot {batch.inputLotNumber}
                          </div>
                        </MfgTableCell>
                        <MfgTableCell>{fmtQty(batch.issuedCartons)}</MfgTableCell>
                        <MfgTableCell>{fmtQty(batch.issuedStandardKg)}</MfgTableCell>
                        <MfgTableCell>{fmtQty(receivedCtn)}</MfgTableCell>
                        <MfgTableCell>{cones || '—'}</MfgTableCell>
                        <MfgTableCell>{fmtQty(batch.totalReceivedNetKg)}</MfgTableCell>
                        <MfgTableCell>{twists}</MfgTableCell>
                        <MfgTableCell>
                          <div className="flex items-center gap-2">
                            <span>{fmtQty(batch.wastageKg)} KG</span>
                            <WastageBadge percent={num(batch.wastagePercent)} />
                          </div>
                        </MfgTableCell>
                        <MfgTableCell>{bill}</MfgTableCell>
                        <MfgTableCell>
                          <MfgStatusBadge status={batch.status} />
                        </MfgTableCell>
                      </MfgTableRow>
                      {open && (
                        <tr>
                          <td colSpan={14} className="bg-[#F8FAFC] px-4 py-4">
                            <div className="space-y-4">
                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7A8FA6]">
                                  Cone receipts (Twisted yarn return)
                                </p>
                                {(batch.receipts || []).length === 0 ? (
                                  <p className="text-sm text-[#7A8FA6]">No receipts yet.</p>
                                ) : (
                                  <MfgTable
                                    columns={[
                                      'Date',
                                      'Output Article',
                                      'Twist (S / Z)',
                                      'Received CTN',
                                      'Cones',
                                      'Net Weight (KG)',
                                      'Bill #',
                                    ]}
                                  >
                                    {(batch.receipts || []).map((r) => (
                                      <MfgTableRow key={r.id}>
                                        <MfgTableCell>
                                          {r.receiptDate
                                            ? new Date(r.receiptDate).toLocaleDateString()
                                            : '—'}
                                        </MfgTableCell>
                                        <MfgTableCell className="font-medium">
                                          {r.outputArticleCount}
                                        </MfgTableCell>
                                        <MfgTableCell>{r.twistDirection}</MfgTableCell>
                                        <MfgTableCell>{fmtQty(r.cartons)}</MfgTableCell>
                                        <MfgTableCell>{r.conesCount}</MfgTableCell>
                                        <MfgTableCell>{fmtQty(r.actualNetWeightKg)}</MfgTableCell>
                                        <MfgTableCell>{r.billNumber || '—'}</MfgTableCell>
                                      </MfgTableRow>
                                    ))}
                                  </MfgTable>
                                )}
                              </div>

                              {batch.status !== 'COMPLETED' && batch.status !== 'CANCELLED' && (
                                <div className="grid gap-3 rounded-xl border border-[#DDE4EE] bg-white p-4 lg:grid-cols-4">
                                  <MfgField label="Date">
                                    <MfgInput
                                      type="date"
                                      value={receiptForm(batch.id).receiptDate}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'receiptDate', e.target.value)
                                      }
                                    />
                                  </MfgField>
                                  <MfgField label="Output Article">
                                    <MfgInput
                                      value={receiptForm(batch.id).outputArticleCount}
                                      onChange={(e) =>
                                        setReceiptField(
                                          batch.id,
                                          'outputArticleCount',
                                          e.target.value
                                        )
                                      }
                                      placeholder="50/24/3200"
                                    />
                                  </MfgField>
                                  <MfgField label="Twist (S / Z)">
                                    <MfgSelect
                                      value={receiptForm(batch.id).twistDirection}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'twistDirection', e.target.value)
                                      }
                                    >
                                      <option value="S">S</option>
                                      <option value="Z">Z</option>
                                    </MfgSelect>
                                  </MfgField>
                                  <MfgField label="Net Weight (KG)">
                                    <MfgInput
                                      type="number"
                                      step="0.01"
                                      value={receiptForm(batch.id).actualNetWeightKg}
                                      onChange={(e) =>
                                        setReceiptField(
                                          batch.id,
                                          'actualNetWeightKg',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </MfgField>
                                  <MfgField label="Received CTN">
                                    <MfgInput
                                      type="number"
                                      step="0.01"
                                      value={receiptForm(batch.id).cartons}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'cartons', e.target.value)
                                      }
                                    />
                                  </MfgField>
                                  <MfgField label="Cones">
                                    <MfgInput
                                      type="number"
                                      value={receiptForm(batch.id).conesCount}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'conesCount', e.target.value)
                                      }
                                    />
                                  </MfgField>
                                  <MfgField label="Brand">
                                    <MfgInput
                                      value={receiptForm(batch.id).outputBrand}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'outputBrand', e.target.value)
                                      }
                                    />
                                  </MfgField>
                                  <MfgField label="Lot #">
                                    <MfgInput
                                      value={receiptForm(batch.id).outputLotNumber}
                                      onChange={(e) =>
                                        setReceiptField(batch.id, 'outputLotNumber', e.target.value)
                                      }
                                      placeholder="Defaults to input lot"
                                    />
                                  </MfgField>
                                  <div className="flex items-end gap-2 lg:col-span-4">
                                    <MfgButton
                                      loading={saving}
                                      onClick={() => void addReceipt(batch.id)}
                                    >
                                      <Plus className="h-4 w-4" /> Add Cone Receipt
                                    </MfgButton>
                                    <MfgInput
                                      placeholder="Bill # 19"
                                      value={completeBill[batch.id] || ''}
                                      onChange={(e) =>
                                        setCompleteBill((prev) => ({
                                          ...prev,
                                          [batch.id]: e.target.value,
                                        }))
                                      }
                                      className="max-w-[180px]"
                                    />
                                    <MfgButton
                                      variant="secondary"
                                      loading={saving}
                                      onClick={() => void completeBatch(batch.id)}
                                    >
                                      Complete Batch & Lock Bill #
                                    </MfgButton>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </MfgTable>
            </div>
          )}
        </MfgCard>
      ) : (
        <MfgCard title="Direct Weft Issue (Bana to Unit 3)">
          {weftIssues.length === 0 ? (
            <MfgEmpty
              title="No weft (Bana) issues"
              message="Issue twisted cones directly to Unit 3 weaving as Weft / Bana."
            />
          ) : (
            <MfgTable
              columns={[
                'Date',
                'CH #',
                'Article',
                'Brand',
                'Lot #',
                'Twist (S / Z)',
                'Issued CTN',
                'Cones',
                'Net Weight (KG)',
                'Section',
              ]}
            >
              {weftIssues.map((row) => (
                <MfgTableRow key={row.id}>
                  <MfgTableCell>
                    {row.issueDate ? new Date(row.issueDate).toLocaleDateString() : '—'}
                  </MfgTableCell>
                  <MfgTableCell className="font-semibold">{row.challanNumber}</MfgTableCell>
                  <MfgTableCell className="font-medium">{row.articleCount}</MfgTableCell>
                  <MfgTableCell>{row.brand || '—'}</MfgTableCell>
                  <MfgTableCell>{row.lotNumber}</MfgTableCell>
                  <MfgTableCell>{row.twistDirection || '—'}</MfgTableCell>
                  <MfgTableCell>{fmtQty(row.issuedCartons)}</MfgTableCell>
                  <MfgTableCell>{row.issuedCones}</MfgTableCell>
                  <MfgTableCell>{fmtQty(row.issuedNetWeightKg)}</MfgTableCell>
                  <MfgTableCell>{row.section || '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold">Issue Twisting Batch / CH</h3>
              <button type="button" onClick={() => setShowBatchModal(false)}>
                <X className="h-4 w-4 text-[#7A8FA6]" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MfgField label="Pick from Godown stock (optional)">
                  <MfgSelect
                    defaultValue=""
                    onChange={(e) => fillFromStock(e.target.value, 'batch')}
                  >
                    <option value="">Select lot…</option>
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.articleCount} · {s.brand || '—'} · {s.lotNumber} (
                        {fmtQty(s.balanceCartons)} CTN)
                      </option>
                    ))}
                  </MfgSelect>
                </MfgField>
              </div>
              <MfgField label="Date">
                <MfgInput
                  type="date"
                  value={batchForm.issueDate}
                  onChange={(e) => setBatchForm((f) => ({ ...f, issueDate: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Machine / Party (Machine)">
                <MfgInput
                  value={batchForm.machineCode}
                  onChange={(e) => setBatchForm((f) => ({ ...f, machineCode: e.target.value }))}
                  placeholder="M-03"
                />
              </MfgField>
              <MfgField label="Machine / Party (Vendor)">
                <MfgInput
                  value={batchForm.vendorName}
                  onChange={(e) => setBatchForm((f) => ({ ...f, vendorName: e.target.value }))}
                  placeholder="Naufil Twisting / R.A Twisting"
                />
              </MfgField>
              <MfgField label="Input Article">
                <MfgInput
                  value={batchForm.inputArticleCount}
                  onChange={(e) =>
                    setBatchForm((f) => ({ ...f, inputArticleCount: e.target.value }))
                  }
                  placeholder="50/24/0"
                />
              </MfgField>
              <MfgField label="Brand">
                <MfgInput
                  value={batchForm.inputBrand}
                  onChange={(e) => setBatchForm((f) => ({ ...f, inputBrand: e.target.value }))}
                  placeholder="Tongkun"
                />
              </MfgField>
              <MfgField label="Lot #">
                <MfgInput
                  value={batchForm.inputLotNumber}
                  onChange={(e) => setBatchForm((f) => ({ ...f, inputLotNumber: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Issued CTN">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={batchForm.issuedCartons}
                  onChange={(e) => setBatchForm((f) => ({ ...f, issuedCartons: e.target.value }))}
                />
              </MfgField>
              <MfgField label="KG per CTN (Default 32)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={batchForm.kgPerCarton}
                  onChange={(e) => setBatchForm((f) => ({ ...f, kgPerCarton: e.target.value }))}
                />
              </MfgField>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#DDE4EE] px-5 py-4">
              <MfgButton variant="secondary" onClick={() => setShowBatchModal(false)}>
                Cancel
              </MfgButton>
              <MfgButton loading={saving} onClick={() => void createBatch()}>
                Issue Batch (creates P CH)
              </MfgButton>
            </div>
          </div>
        </div>
      )}

      {showWeftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] px-5 py-4">
              <h3 className="text-sm font-bold">Direct Weft Issue (Bana to Unit 3)</h3>
              <button type="button" onClick={() => setShowWeftModal(false)}>
                <X className="h-4 w-4 text-[#7A8FA6]" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MfgField label="Pick twisted stock">
                  <MfgSelect defaultValue="" onChange={(e) => fillFromStock(e.target.value, 'weft')}>
                    <option value="">Select lot…</option>
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.articleCount} · {s.brand || '—'} · {s.lotNumber} (
                        {fmtQty(s.balanceWeightKg)} KG)
                      </option>
                    ))}
                  </MfgSelect>
                </MfgField>
              </div>
              <MfgField label="Article">
                <MfgInput
                  value={weftForm.articleCount}
                  onChange={(e) => setWeftForm((f) => ({ ...f, articleCount: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Lot #">
                <MfgInput
                  value={weftForm.lotNumber}
                  onChange={(e) => setWeftForm((f) => ({ ...f, lotNumber: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Brand">
                <MfgInput
                  value={weftForm.brand}
                  onChange={(e) => setWeftForm((f) => ({ ...f, brand: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Twist (S / Z)">
                <MfgSelect
                  value={weftForm.twistDirection}
                  onChange={(e) => setWeftForm((f) => ({ ...f, twistDirection: e.target.value }))}
                >
                  <option value="S">S</option>
                  <option value="Z">Z</option>
                </MfgSelect>
              </MfgField>
              <MfgField label="Issued CTN">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={weftForm.issuedCartons}
                  onChange={(e) => setWeftForm((f) => ({ ...f, issuedCartons: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Cones">
                <MfgInput
                  type="number"
                  value={weftForm.issuedCones}
                  onChange={(e) => setWeftForm((f) => ({ ...f, issuedCones: e.target.value }))}
                />
              </MfgField>
              <MfgField label="Net Weight (KG)">
                <MfgInput
                  type="number"
                  step="0.01"
                  value={weftForm.issuedNetWeightKg}
                  onChange={(e) =>
                    setWeftForm((f) => ({ ...f, issuedNetWeightKg: e.target.value }))
                  }
                />
              </MfgField>
              <MfgField label="Section">
                <MfgInput
                  value={weftForm.section}
                  onChange={(e) => setWeftForm((f) => ({ ...f, section: e.target.value }))}
                  placeholder="Sulzer First Part"
                />
              </MfgField>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#DDE4EE] px-5 py-4">
              <MfgButton variant="secondary" onClick={() => setShowWeftModal(false)}>
                Cancel
              </MfgButton>
              <MfgButton loading={saving} onClick={() => void createWeft()}>
                Issue Bana to Unit 3
              </MfgButton>
            </div>
          </div>
        </div>
      )}
    </MfgPage>
  );
}

export default function WeavingTwistingPage() {
  return (
    <TextileWeavingGate title="Unit 1: Twisting & Coning" subtitle="Wastage · Bill # · Bana">
      <Suspense
        fallback={
          <MfgPage>
            <MfgCard>
              <MfgLoading />
            </MfgCard>
          </MfgPage>
        }
      >
        <TwistingBody />
      </Suspense>
    </TextileWeavingGate>
  );
}
