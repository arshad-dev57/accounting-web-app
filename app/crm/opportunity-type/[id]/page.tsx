'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getOpportunityType,
  updateOpportunityType,
  deleteOpportunityType,
  type OpportunityTypeRecord,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';
import NewOpportunityTypePage from '../new/page';

export default function OpportunityTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const typeId = resolvedParams.id;

  // Support ERPNext temporary docname pattern like 'new-opportunity-type-xxxx'
  if (typeId.startsWith('new-opportunity-type-')) {
    return <NewOpportunityTypePage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [typeName, setTypeName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOpportunityType(typeId)
      .then((data) => {
        if (data) {
          setTypeName(data.name || '');
          setDescription((data as any).description || '');
          setIsActive(data.isActive !== false);
          setDirty(false);
        } else {
          toast.error('Opportunity Type not found');
          router.push('/crm/opportunity-type');
        }
      })
      .catch(() => {
        toast.error('Failed to load opportunity type');
        router.push('/crm/opportunity-type');
      })
      .finally(() => setLoading(false));
  }, [typeId, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = typeName.trim();
    if (!name) {
      toast.error('Type Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateOpportunityType(typeId, {
        name,
        description: description.trim() || undefined,
        isActive,
      } as any);

      toast.success('Opportunity Type updated');
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete opportunity type "${typeName}"?`)) return;
    setDeleting(true);
    try {
      await deleteOpportunityType(typeId);
      toast.success('Opportunity Type deleted');
      router.push('/crm/opportunity-type');
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
        Loading opportunity type…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title={typeName || 'Opportunity Type'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/opportunity-type')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/opportunity-type/new"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              + New
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      />

      <form onSubmit={handleSave}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Type Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Deal Categorization:</strong> Used across CRM deals and forecast reports to break down pipeline volume by offering.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive types cannot be assigned to new Opportunity records.
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
                <Tag className="w-4 h-4 text-[#014582]" />
                Opportunity Type Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Type Name" required>
                  <input
                    type="text"
                    required
                    value={typeName}
                    onChange={(e) => {
                      setTypeName(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                </DeskField>

                <div className="md:col-span-2">
                  <DeskField label="Description">
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Optional notes or scope description for this deal type…"
                      className={deskInput}
                    />
                  </DeskField>
                </div>

                <div className="pt-2 md:col-span-2">
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
                </div>
              </div>
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

