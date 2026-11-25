'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Info, CheckCircle2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { createLeadSource } from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';

const PRESET_COLORS = [
  '#014582', // Deep Navy Brand
  '#2563eb', // Blue
  '#059669', // Emerald
  '#10b981', // Green
  '#d97706', // Amber
  '#ea580c', // Orange
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#4b5563', // Slate
];

function NewLeadSourceForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [color, setColor] = useState('#014582');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = sourceName.trim();
    if (!name) {
      toast.error('Source Name is required');
      return;
    }

    setSaving(true);
    try {
      await createLeadSource({
        name,
        color: color || '#014582',
        isActive,
        isDefault,
      });

      toast.success(`Lead Source "${name}" created successfully`);
      router.push('/crm/lead-source');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead source');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title="New Lead Source"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/lead-source')}
        actions={
          <Link
            href="/crm/lead-source"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Source Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Acquisition Attribution:</strong> Every incoming lead can be tagged with a source for pipeline and CAC reporting.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Default Channel:</strong> If marked as default, new web leads without a specified UTM channel will inherit this source.
                    </p>
                  </div>
                </div>
              </DeskSideCard>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#014582]" />
                Lead Source Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Source Name" required>
                  <input
                    type="text"
                    required
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. Google Ads, Trade Show 2026, Referral"
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <DeskField label="Badge Color">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#014582"
                        className={`${deskInput} font-mono`}
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            color.toLowerCase() === c.toLowerCase()
                              ? 'scale-125 border-gray-900 ring-2 ring-blue-200'
                              : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </DeskField>

                <div className="pt-2 flex flex-col sm:flex-row gap-6 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Is Active
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Default System Source
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

export default function NewLeadSourcePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Lead Source form…
        </div>
      }
    >
      <NewLeadSourceForm />
    </Suspense>
  );
}

