'use client';

import { useEffect, useState } from 'react';
import { clearTaxContextCache, loadTaxContext, taxService } from '../lib/tax-service';

export default function TaxUseToggle({ onChanged }: { onChanged?: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTaxContext()
      .then((ctx) => setEnabled(Boolean(ctx.enabled)))
      .catch(() => setEnabled(false))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setError('');
    try {
      await taxService.setEnabled(next);
      clearTaxContextCache();
      setEnabled(next);
      onChanged?.(next);
    } catch (e: any) {
      setError(e.message || 'Could not update tax setting');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className={`rounded-xl border p-5 ${enabled ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Use taxation in this company</p>
          <p className="text-sm text-gray-600 mt-1">
            {enabled
              ? 'ON — VAT/GST/sales tax applies in POS, sales, purchases, inventory and accounting.'
              : 'OFF — no tax is calculated or shown anywhere in this company’s flow.'}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
            enabled ? 'bg-[#014582]' : 'bg-gray-300'
          } disabled:opacity-50`}
          aria-pressed={enabled}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow mt-0.5 transition ${
              enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
