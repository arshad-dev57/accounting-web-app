'use client';

import { useState } from 'react';
import { Check, Loader2, Store, UtensilsCrossed } from 'lucide-react';
import type { PosMode } from '@/lib/pos-roles';
import { savePosMode } from '@/lib/pos-settings-service';
import { saveUserToLocal } from '@/lib/permission-service';

type Props = {
  initialMode?: PosMode;
  onSaved: (mode: PosMode) => void;
  compact?: boolean;
};

export default function PosModePicker({ initialMode = 'retail', onSaved, compact }: Props) {
  const [selected, setSelected] = useState<PosMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const settings = await savePosMode(selected);
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          saveUserToLocal({
            ...user,
            posMode: settings.posMode,
            posModeConfigured: settings.posModeConfigured,
            company: {
              ...(user.company || {}),
              posMode: settings.posMode,
              posModeConfigured: settings.posModeConfigured,
            },
          });
        } catch {
          /* ignore */
        }
      }
      onSaved(settings.posMode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save POS type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      {!compact && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Choose your POS type</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pick once here when you set up Point of Sale. User roles (cashier, waiter, kitchen) depend on this choice.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelected('retail')}
          className={`rounded-xl border p-4 text-left transition ${
            selected === 'retail'
              ? 'border-[#014582] bg-[#014582]/5 ring-1 ring-[#014582]/30'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-[#014582]" />
            <span className="font-semibold text-gray-900">Retail / Shop</span>
            {selected === 'retail' && <Check className="w-4 h-4 text-[#014582] ml-auto" />}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Standard desktop POS — barcode checkout, shifts, receipts. Create <strong>cashier</strong> users for the register.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelected('restaurant')}
          className={`rounded-xl border p-4 text-left transition ${
            selected === 'restaurant'
              ? 'border-[#014582] bg-[#014582]/5 ring-1 ring-[#014582]/30'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-[#014582]" />
            <span className="font-semibold text-gray-900">Restaurant / Cafe</span>
            {selected === 'restaurant' && <Check className="w-4 h-4 text-[#014582] ml-auto" />}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Waiters use the <strong>Order Pick</strong> app. Kitchen display + cashier on desktop. Create{' '}
            <strong>waiter</strong>, <strong>kitchen</strong>, and <strong>cashier</strong> users.
          </p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#014582] text-white text-sm font-semibold hover:bg-[#013566] disabled:opacity-60"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {compact ? 'Save POS type' : 'Continue with this POS type'}
      </button>
    </div>
  );
}
