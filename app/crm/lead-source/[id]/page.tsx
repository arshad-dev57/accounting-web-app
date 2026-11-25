'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getLeadSource,
  updateLeadSource,
  deleteLeadSource,
  type LeadSourceRecord,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';
import NewLeadSourcePage from '../new/page';

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

export default function LeadSourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sourceId = resolvedParams.id;

  // Support temporary new-record docname pattern like 'new-lead-source-xxxx'
  if (sourceId.startsWith('new-lead-source-')) {
    return <NewLeadSourcePage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [sourceName, setSourceName] = useState('');
  const [color, setColor] = useState('#014582');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLeadSource(sourceId)
      .then((data) => {
        if (data) {
          setSourceName(data.name || '');
          setColor((data as any).color || '#014582');
          setIsActive(data.isActive !== false);
          setIsDefault(!!(data as any).isDefault);
          setDirty(false);
        } else {
          toast.error('Lead Source not found');
          router.push('/crm/lead-source');
        }
      })
      .catch(() => {
        toast.error('Failed to load lead source');
        router.push('/crm/lead-source');
      })
      .finally(() => setLoading(false));
  }, [sourceId, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = sourceName.trim();
    if (!name) {
      toast.error('Source Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateLeadSource(sourceId, {
        name,
        color,
        isActive,
        isDefault,
      });

      toast.success('Lead Source updated');
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDefault) {
      toast.error('Cannot delete default system source');
      return;
    }
    if (!confirm(`Are you sure you want to delete lead source "${sourceName}"?`)) return;
    setDeleting(true);
    try {
      await deleteLeadSource(sourceId);
      toast.success('Lead Source deleted');
      router.push('/crm/lead-source');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
        Loading lead source…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title={sourceName || 'Lead Source'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/lead-source')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/lead-source/new"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              + New
            </Link>
            {!isDefault && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        }
      />

      <form onSubmit={handleSave}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Source Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Channel Tracking:</strong> Associated leads and opportunities will reflect this source label in analytics.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive sources are hidden from lead creation dropdowns.
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
                    onChange={(e) => {
                      setSourceName(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Badge Color">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          setColor(e.target.value);
                          setDirty(true);
                        }}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          setColor(e.target.value);
                          setDirty(true);
                        }}
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
                          onClick={() => {
                            setColor(c);
                            setDirty(true);
                          }}
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
                      onChange={(e) => {
                        setIsActive(e.target.checked);
                        setDirty(true);
                      }}
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
                      onChange={(e) => {
                        setIsDefault(e.target.checked);
                        setDirty(true);
                      }}
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

