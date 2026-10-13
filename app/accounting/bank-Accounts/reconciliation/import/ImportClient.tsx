'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { bankReconciliationService, type StatementTxn } from '@/lib/bank-reconciliation-service';
import { bankAccountService, type BankAccount } from '@/lib/bank-accounts-service';
import { useCurrency } from '@/lib/currency-context';

const MAP_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'reference', label: 'Reference', required: false },
  { key: 'debit', label: 'Debit', required: false },
  { key: 'credit', label: 'Credit', required: false },
  { key: 'amount', label: 'Amount', required: false },
  { key: 'balance', label: 'Balance', required: false },
  { key: 'valueDate', label: 'Value Date', required: false },
] as const;

function fmtMoney(n: number, symbol = 'Rs') {
  return `${symbol} ${new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`;
}

export default function BankStatementImportPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { symbol } = useCurrency();

  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState(search.get('bankAccountId') || '');
  const [file, setFile] = useState<File | null>(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [busy, setBusy] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importId, setImportId] = useState('');
  const [preview, setPreview] = useState<StatementTxn[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    bankAccountService.getAccounts({ limit: 100, status: 'Active' })
      .then((res) => setAccounts(res.data || []))
      .catch(() => toast.error('Failed to load bank accounts'));
  }, []);

  const canPreview = !!bankAccountId && !!file;
  const mappingOk = !!mapping.date && (!!mapping.debit || !!mapping.credit || !!mapping.amount);

  async function runPreview(nextMapping?: Record<string, string>) {
    if (!file || !bankAccountId) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bankAccountId', bankAccountId);
      if (openingBalance) form.append('openingBalance', openingBalance);
      if (closingBalance) form.append('closingBalance', closingBalance);
      const map = nextMapping || mapping;
      if (Object.keys(map).length) form.append('columnMapping', JSON.stringify(map));
      const data = await bankReconciliationService.previewImport(form);
      setImportId(data.importId);
      setHeaders(data.headers || []);
      setMapping(data.mapping || data.suggestedMapping || {});
      setPreview(data.preview || []);
      setDuplicateCount(data.duplicateCount || 0);
      setRowCount(data.rowCount || 0);
      setStep(3);
      toast.success('File parsed — review mapping & preview');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!importId) return;
    setBusy(true);
    try {
      const res = await bankReconciliationService.confirmImport({
        importId,
        rows: preview,
        columnMapping: mapping,
        openingBalance: openingBalance ? Number(openingBalance) : undefined,
        closingBalance: closingBalance ? Number(closingBalance) : undefined,
        skipDuplicates: true,
        rememberMapping: true,
        reconciliationId: search.get('reconciliationId') || undefined,
      });
      toast.success((res as { message?: string }).message || `Imported ${(res.data as { imported?: number })?.imported ?? 0} rows`);
      const reconId = search.get('reconciliationId');
      router.push(reconId ? `/accounting/bank-Accounts/reconciliation/${reconId}` : '/accounting/bank-Accounts/reconciliation');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  const steps = useMemo(() => [
    { n: 1, label: 'Bank Account' },
    { n: 2, label: 'Upload' },
    { n: 3, label: 'Map Columns' },
    { n: 4, label: 'Preview' },
    { n: 5, label: 'Import' },
  ], []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/accounting/bank-Accounts/reconciliation" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Reconciliation
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-[#014582]" />
          Import Bank Statement
        </h1>
        <p className="text-sm text-gray-500 mt-1">CSV or Excel — no bank API. Duplicates are detected automatically.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <div key={s.n} className={`rounded-full px-3 py-1 text-xs font-semibold ${step === s.n ? 'bg-[#014582] text-white' : step > s.n ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {s.n}. {s.label}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Bank Account</label>
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">Select…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.accountName} · {a.accountNumber}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Statement Opening (optional)</label>
                <input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Statement Closing (optional)</label>
                <input type="number" step="0.01" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <button type="button" disabled={!bankAccountId} onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 cursor-pointer hover:border-[#014582]/40">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{file ? file.name : 'Drop CSV / Excel or click to browse'}</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Back</button>
              <button type="button" disabled={!canPreview || busy} onClick={() => runPreview()} className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Parse & Continue
              </button>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Column Mapping</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAP_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}{f.required ? ' *' : ''}</label>
                  <select value={mapping[f.key] || ''} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">—</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button type="button" disabled={!mappingOk || busy} onClick={() => runPreview(mapping)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Re-apply mapping</button>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">{rowCount} rows · {duplicateCount} duplicate(s) will be skipped</p>
              <button type="button" onClick={() => setStep(4)} disabled={!preview.length} className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step >= 4 && preview.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Preview (first {preview.length})</h3>
            <div className="overflow-x-auto max-h-80 border border-gray-100 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-right">Credit</th>
                    <th className="px-3 py-2 text-left">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={r.fingerprint || i} className="border-t border-gray-50">
                      <td className="px-3 py-2">{r.transactionDate ? new Date(r.transactionDate).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2 truncate max-w-[240px]">{r.description}{r.reference ? <span className="text-xs text-gray-400 block">{r.reference}</span> : null}</td>
                      <td className="px-3 py-2 text-right text-red-600">{r.debit ? fmtMoney(r.debit, symbol) : ''}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{r.credit ? fmtMoney(r.credit, symbol) : ''}</td>
                      <td className="px-3 py-2">{r.isDuplicate ? <span className="text-xs font-semibold text-amber-600">Duplicate</span> : <span className="text-xs text-emerald-600">New</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" disabled={busy} onClick={confirmImport} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
