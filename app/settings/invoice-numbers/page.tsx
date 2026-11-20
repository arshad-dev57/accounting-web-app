'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Hash, Pencil, Check, X, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { SETTINGS_SAVE_EVENT } from '../nav';
import {
  documentNumberingService,
  type DocumentNumberSeries,
} from '@/lib/document-numbering-service';
import { useCompanyOptional } from '@/lib/company-context';

function previewNumber(doc: Pick<DocumentNumberSeries, 'prefix' | 'nextNumber' | 'padLength'>) {
  const n = Math.max(1, Number(doc.nextNumber) || 1);
  const pad = Math.max(1, Math.min(8, Number(doc.padLength) || 4));
  const prefix = (doc.prefix || '').trim().toUpperCase();
  return `${prefix}${prefix ? '-' : ''}${String(n).padStart(pad, '0')}`;
}

export function InvoiceNumbersSettingsPage() {
  const companyCtx = useCompanyOptional();
  const [allowManual, setAllowManual] = useState(true);
  const [docs, setDocs] = useState<DocumentNumberSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ prefix: string; nextNumber: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentNumberingService.getSettings();
      setAllowManual(Boolean(data.allowManualInvoiceNumber));
      setDocs(data.series || []);
      setDirty(false);
      setEditingId(null);
      setDraft(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load document numbering settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings, companyCtx?.activeCompanyId]);

  const saveSettings = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = await documentNumberingService.saveSettings({
        allowManualInvoiceNumber: allowManual,
        series: docs.map((d) => ({
          documentType: d.documentType,
          label: d.label,
          prefix: d.prefix,
          nextNumber: d.nextNumber,
          padLength: d.padLength,
          sortOrder: d.sortOrder,
          isActive: d.isActive !== false,
        })),
      });
      setAllowManual(Boolean(data.allowManualInvoiceNumber));
      setDocs(data.series || []);
      setDirty(false);
      setEditingId(null);
      setDraft(null);
      toast.success('Document numbering saved for this company');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [allowManual, docs, saving]);

  useEffect(() => {
    const onSave = () => {
      void saveSettings();
    };
    window.addEventListener(SETTINGS_SAVE_EVENT, onSave);
    return () => window.removeEventListener(SETTINGS_SAVE_EVENT, onSave);
  }, [saveSettings]);

  const startEdit = (doc: DocumentNumberSeries) => {
    setEditingId(doc.documentType);
    setDraft({ prefix: doc.prefix, nextNumber: String(doc.nextNumber) });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const applyEdit = (documentType: string) => {
    if (!draft) return;
    const next = Math.max(1, parseInt(draft.nextNumber, 10) || 1);
    const prefix = draft.prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    setDocs((prev) =>
      prev.map((d) =>
        d.documentType === documentType
          ? { ...d, prefix: prefix || d.prefix, nextNumber: next }
          : d
      )
    );
    setDirty(true);
    setEditingId(null);
    setDraft(null);
  };

  const activePreview = useMemo(() => {
    if (!editingId || !draft) return null;
    const base = docs.find((d) => d.documentType === editingId);
    if (!base) return null;
    return previewNumber({
      ...base,
      prefix: draft.prefix,
      nextNumber: parseInt(draft.nextNumber, 10) || 1,
    });
  }, [editingId, draft, docs]);

  const coreDocs = docs.filter((d) => !d.documentType.startsWith('import-') && !d.documentType.startsWith('export-'));
  const importDocs = docs.filter((d) => d.documentType.startsWith('import-'));
  const exportDocs = docs.filter((d) => d.documentType.startsWith('export-'));

  const renderDocCard = (doc: DocumentNumberSeries) => {
    const isEditing = editingId === doc.documentType;
    return (
      <section
        key={doc.documentType}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{doc.label}</h3>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
            {isEditing && activePreview ? activePreview : previewNumber(doc)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex-1 text-xs font-medium text-gray-600">
            Prefix
            <input
              type="text"
              disabled={!isEditing}
              value={isEditing && draft ? draft.prefix : doc.prefix}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, prefix: e.target.value.toUpperCase() } : d))
              }
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${
                isEditing
                  ? 'border-[#014582]/40 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]/30'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            />
          </label>

          <label className="flex-1 text-xs font-medium text-gray-600">
            Next Number
            <input
              type="number"
              min={1}
              disabled={!isEditing}
              value={isEditing && draft ? draft.nextNumber : doc.nextNumber}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, nextNumber: e.target.value } : d))
              }
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono ${
                isEditing
                  ? 'border-[#014582]/40 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]/30'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            />
          </label>

          {isEditing ? (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => applyEdit(doc.documentType)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#014582] text-white text-xs font-semibold hover:bg-[#01366a]"
              >
                <Check className="w-3.5 h-3.5" />
                Apply
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startEdit(doc)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:border-[#014582]/30 hover:text-[#014582] shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#014582]" />
        <p className="text-sm text-gray-500 mt-3">Loading document numbering…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Hash className="w-6 h-6 text-[#014582]" />
            Document Numbering
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure prefixes and starting numbers for this company. New sales, purchase, import,
            and export documents use these series automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSettings()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
        </button>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Allow Manual Invoice Number</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Invoice numbers can be typed or edited by hand. When a custom number is used, the
              auto-increment counter does not advance.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowManual}
            onClick={() => {
              setAllowManual((v) => !v);
              setDirty(true);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              allowManual ? 'bg-[#014582]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                allowManual ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {allowManual && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              <span className="font-semibold">Note:</span> Users can now edit invoice numbers. If a
              custom number is entered it will be used as-is and the sequence counter will not
              increment — the next auto-generated number will remain the same.
            </p>
          </div>
        )}
      </section>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Sales & Purchases
        </h2>
        {coreDocs.map(renderDocCard)}
      </div>

      {importDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Import</h2>
          {importDocs.map(renderDocCard)}
        </div>
      )}

      {exportDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Export</h2>
          {exportDocs.map(renderDocCard)}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {dirty ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            You have unsaved changes. Click <span className="font-semibold">Save Settings</span> to
            apply them company-wide.
          </p>
        ) : (
          <p className="text-xs text-gray-400">All changes are saved for the active company.</p>
        )}
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void saveSettings()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default function InvoiceNumbersRoute() {
  return <InvoiceNumbersSettingsPage />;
}
