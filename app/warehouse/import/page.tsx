'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Package,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { getStoredCompanyId } from '@/lib/company-context';

type Step = 'upload' | 'preview' | 'processing' | 'result';

type PreviewRow = {
  excelRow: number;
  sku: string;
  name: string;
  warehouse?: string;
  warehouseCode?: string;
  uom?: string;
  openingQty?: number | null;
  currentQty?: number | null;
  unitCost?: number | null;
  severity: 'valid' | 'warning' | 'error' | 'duplicate';
  action: string;
  errors: string[];
  warnings: string[];
};

type MastersToCreate = {
  warehouses?: string[];
  categories?: string[];
  subCategories?: string[];
  suppliers?: string[];
  uoms?: string[];
};

type BatchMeta = {
  id: string;
  batchNumber: string;
  status: string;
  companyId?: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
  importableRows?: number;
  openingDate?: string;
  mastersToCreate?: MastersToCreate;
};

type ImportResult = {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  batch: { batchNumber: string; status: string; resultSummary?: any };
};

function authToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_token') || '';
}

function severityClass(s: string) {
  if (s === 'error') return 'bg-red-50 text-red-800 border-red-200';
  if (s === 'warning' || s === 'duplicate') return 'bg-amber-50 text-amber-900 border-amber-200';
  return 'bg-emerald-50 text-emerald-900 border-emerald-200';
}

export function InventoryImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [duplicateSkuMode, setDuplicateSkuMode] = useState<'skip' | 'update' | 'error'>('skip');
  const [createMissingMasters, setCreateMissingMasters] = useState(true);
  const [forceReimport, setForceReimport] = useState(false);
  const [openingDate, setOpeningDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateFileWarn, setDuplicateFileWarn] = useState<{
    batchNumber: string;
    message: string;
  } | null>(null);
  const [batch, setBatch] = useState<BatchMeta | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'valid' | 'warning' | 'error' | 'duplicate'>('all');
  const [result, setResult] = useState<ImportResult | null>(null);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const downloadTemplate = async () => {
    try {
      const token = authToken();
      const companyId = getStoredCompanyId() || '';
      const res = await fetch(`${API_BASE_URL}/api/warehouse/inventory/import/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Company-Id': companyId,
        },
      });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Factory_ERP_Inventory_Import.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Template download failed');
    }
  };

  const onFilePicked = (f: File | null) => {
    setError('');
    setDuplicateFileWarn(null);
    setFile(f);
  };

  const runPreview = async (force = false) => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setLoading(true);
    setError('');
    setDuplicateFileWarn(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('duplicateSkuMode', duplicateSkuMode);
      fd.append('createMissingMasters', String(createMissingMasters));
      fd.append('forceReimport', String(force || forceReimport));
      if (openingDate) fd.append('openingDate', openingDate);

      const res = await apiClient.post('/api/warehouse/inventory/import/preview', fd);
      if (!res.success) {
        const code = res.data?.code;
        if (code === 'DUPLICATE_IMPORT_FILE' || res.statusCode === 409) {
          setDuplicateFileWarn({
            batchNumber: res.data?.data?.batchNumber || '',
            message: res.message || 'This file was already imported',
          });
          return;
        }
        throw new Error(res.message || 'Preview failed');
      }
      const data = res.data?.data || res.data;
      setBatch({
        ...data.batch,
        mastersToCreate: data.batch?.mastersToCreate || data.mastersToCreate || null,
      });
      setRows(data.rows || []);
      setStep('preview');
    } catch (e: any) {
      const msg = e?.message || 'Preview failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!batch?.id) return;
    const importable = rows.filter((r) => !r.errors?.length && r.action !== 'skip');
    if (!importable.length) {
      const allDupes =
        rows.length > 0 &&
        rows.every((r) => r.action === 'skip' || r.severity === 'duplicate');
      setError(
        allDupes
          ? 'All SKUs already exist in this company — import already done. Products are split by Warehouse in the Excel; change the warehouse filter on Products / Stock to see them (not just Finished Goods). To refresh masters/stock, set “If SKU already exists” to Update and preview again.'
          : 'No importable rows. Fix errors or change duplicate SKU mode.'
      );
      return;
    }
    if (
      createMissingMasters &&
      !window.confirm(
        'Create missing master data (warehouses / categories / suppliers / UOMs) has been enabled. Continue?'
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        `Import ${importable.length} row(s) into inventory?\n\nOpening quantities will post as OPENING_BALANCE stock ledger entries.`
      )
    ) {
      return;
    }

    setStep('processing');
    setLoading(true);
    setError('');
    setProgress({ done: 0, total: importable.length });
    try {
      const res = await apiClient.post(
        `/api/warehouse/inventory/import/${batch.id}/confirm`,
        batch.companyId ? { companyId: batch.companyId } : {}
      );
      if (!res.success) throw new Error(res.message || 'Import failed');
      const data = res.data?.data || res.data;

      // Sync completion (small files / already done)
      if (!data?.async && data?.batch) {
        setResult({
          importedCount: data.importedCount || 0,
          updatedCount: data.updatedCount || 0,
          skippedCount: data.skippedCount || 0,
          batch: data.batch,
        });
        setStep('result');
        return;
      }

      // Async: poll until Completed / Failed
      const pollId = data.batchId || batch.id;
      const companyForPoll = data.companyId || batch.companyId;
      const deadline = Date.now() + 45 * 60 * 1000;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await apiClient.get(
          `/api/warehouse/inventory/import/batches/${pollId}`
        );
        if (!statusRes.success) continue;
        const b = statusRes.data?.data || statusRes.data;
        if (!b) continue;

        const summary = b.resultSummary || {};
        if (typeof summary.progress === 'number') {
          setProgress({
            done: summary.progress,
            total: summary.total || importable.length,
          });
        }

        if (b.status === 'Completed' || b.status === 'CompletedWithWarnings') {
          setResult({
            importedCount: b.importedCount || 0,
            updatedCount: b.updatedCount || 0,
            skippedCount: b.skippedCount || 0,
            batch: b,
          });
          setStep('result');
          return;
        }
        if (b.status === 'Failed') {
          throw new Error(summary.error || 'Import failed on server');
        }
        // keep polling while Processing
        void companyForPoll;
      }
      throw new Error('Import is still running — refresh later and check Inventory.');
    } catch (e: any) {
      setError(e?.message || 'Import failed');
      setStep('preview');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const filteredRows = rows.filter((r) => (filter === 'all' ? true : r.severity === filter));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFilePicked(f);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-7 h-7 text-[#014582]" />
            Import Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload → Validate → Preview → Confirm. Opening stock posts as auditable ledger movements.
          </p>
        </div>
        <Link
          href="/warehouse/products"
          className="text-sm text-[#014582] font-medium hover:underline inline-flex items-center gap-1"
        >
          <Package className="w-4 h-4" />
          View Products
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {(
          [
            ['upload', '1. Upload'],
            ['preview', '2. Preview'],
            ['processing', '3. Processing'],
            ['result', '4. Result'],
          ] as const
        ).map(([key, label]) => (
          <span
            key={key}
            className={`px-3 py-1.5 rounded-full border ${
              step === key
                ? 'bg-[#014582] text-white border-[#014582]'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                dragOver
                  ? 'border-[#014582] bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="w-10 h-10 mx-auto text-[#014582] mb-3" />
              <p className="text-sm font-medium text-gray-800">
                Drag & drop Excel / CSV here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Accepted: .xlsx, .xls, .csv — columns match Factory_ERP_Inventory_Import.xlsx
              </p>
              {file && (
                <p className="mt-3 text-sm text-[#014582] font-medium">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => onFilePicked(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-gray-600 font-medium">If SKU already exists</span>
                <select
                  value={duplicateSkuMode}
                  onChange={(e) => setDuplicateSkuMode(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  <option value="skip">Skip existing item</option>
                  <option value="update">Update existing item</option>
                  <option value="error">Fail row (do not import)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 font-medium">Inventory opening date</span>
                <input
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={createMissingMasters}
                onChange={(e) => setCreateMissingMasters(e.target.checked)}
                className="mt-1"
              />
              <span>
                Create missing master data (Warehouse / Category / Sub Category / Supplier / UOM) —
                requires confirmation before import.
              </span>
            </label>

            {duplicateFileWarn && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
                <p>{duplicateFileWarn.message}</p>
                {duplicateFileWarn.batchNumber && (
                  <p className="text-xs">Prior batch: {duplicateFileWarn.batchNumber}</p>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[#014582] font-medium"
                  onClick={() => {
                    setForceReimport(true);
                    void runPreview(true);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Continue re-import anyway
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={!file || loading}
              onClick={() => void runPreview(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#014582] text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Validate & Preview
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && batch && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: batch.totalRows },
              { label: 'Valid', value: batch.validRows, tone: 'text-emerald-700' },
              { label: 'Warnings', value: batch.warningRows, tone: 'text-amber-700' },
              { label: 'Errors', value: batch.errorRows, tone: 'text-red-700' },
              { label: 'Duplicates', value: batch.duplicateRows, tone: 'text-amber-700' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-400">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.tone || 'text-gray-900'}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {batch.errorRows === 0 && (batch.importableRows ?? 0) > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {batch.importableRows} row(s) ready to import. Amber “warning” rows are informational only —
              Confirm Import will still process them.
            </div>
          )}

          {(batch.importableRows ?? 0) === 0 && (batch.duplicateRows ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 space-y-1">
              <p className="font-semibold">All rows are duplicates — these SKUs are already in the database.</p>
              <p>
                Import is complete. Stock is stored per warehouse from your Excel. Open Products / Stock
                Summary and switch the warehouse (Main, Raw Material, Finished Goods, Spare Parts, etc.)
                to see each group. Only Finished Goods shows ~72 items; other warehouses hold the rest.
              </p>
              <p className="text-xs">
                Need to refresh existing items? Set “If SKU already exists” → <strong>Update</strong>, then
                Validate & Preview again.
              </p>
            </div>
          )}

          {batch.mastersToCreate &&
            Object.values(batch.mastersToCreate).some((list) => (list?.length || 0) > 0) && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 space-y-1.5">
                <p className="font-semibold">These masters will be created on confirm:</p>
                {(
                  [
                    ['Warehouses', batch.mastersToCreate.warehouses],
                    ['Categories', batch.mastersToCreate.categories],
                    ['Sub categories', batch.mastersToCreate.subCategories],
                    ['Suppliers', batch.mastersToCreate.suppliers],
                    ['UOMs', batch.mastersToCreate.uoms],
                  ] as const
                ).map(([label, list]) =>
                  list && list.length ? (
                    <p key={label}>
                      <span className="font-medium">{label}:</span> {list.join(', ')}
                    </p>
                  ) : null
                )}
                <p className="text-xs text-sky-800 pt-1">
                  Opening Quantity posts as OPENING_BALANCE (Current Quantity is ignored when both are filled).
                </p>
              </div>
            )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Batch:</span>
            <span className="font-mono font-semibold">{batch.batchNumber}</span>
            <div className="flex gap-1 ml-auto">
              {(['all', 'valid', 'warning', 'error', 'duplicate'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md border text-xs capitalize ${
                    filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">WH</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={`${r.excelRow}-${r.sku}`} className={`border-t ${severityClass(r.severity)}`}>
                      <td className="px-3 py-2 font-mono">{r.excelRow}</td>
                      <td className="px-3 py-2 font-medium">{r.sku}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.warehouseCode || r.warehouse || '—'}</td>
                      <td className="px-3 py-2">{r.openingQty ?? r.currentQty ?? 0}</td>
                      <td className="px-3 py-2">{r.unitCost ?? '—'}</td>
                      <td className="px-3 py-2 capitalize">{r.severity}</td>
                      <td className="px-3 py-2 text-xs max-w-xs">
                        {r.errors?.map((e) => (
                          <div key={e} className="flex gap-1 text-red-700">
                            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {e}
                          </div>
                        ))}
                        {r.warnings?.map((w) => (
                          <div key={w} className="flex gap-1 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {w}
                          </div>
                        ))}
                        {!r.errors?.length && !r.warnings?.length && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setBatch(null);
                setRows([]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void confirmImport()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#014582] text-white text-sm font-semibold disabled:opacity-50"
            >
              Confirm Import
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-[#014582] mx-auto mb-4" />
          <p className="font-semibold text-gray-900">Processing import…</p>
          <p className="text-sm text-gray-500 mt-1">
            Large files run in the background. Keep this tab open — progress updates every few
            seconds.
          </p>
          {progress && (
            <p className="text-sm font-mono text-gray-700 mt-3">
              {progress.done} / {progress.total} rows
            </p>
          )}
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 mb-4">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Import {result.batch?.status || 'Completed'}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 font-mono">{result.batch?.batchNumber}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Imported</p>
                <p className="text-xl font-bold">{result.importedCount}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Updated</p>
                <p className="text-xl font-bold">{result.updatedCount}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Skipped</p>
                <p className="text-xl font-bold">{result.skippedCount}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Warnings</p>
                <p className="text-xl font-bold">{batch?.warningRows ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/warehouse/products"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold"
            >
              View Imported Items
            </Link>
            <Link
              href="/warehouse/stock-movement"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm"
            >
              View Stock Ledger
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setFile(null);
                setBatch(null);
                setRows([]);
                setResult(null);
                setForceReimport(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryImportPage;
