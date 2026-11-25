'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSalesStage,
  updateSalesStage,
  deleteSalesStage,
  type SalesStageRecord,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';
import NewSalesStagePage from '../new/page';

export default function SalesStageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const stageId = resolvedParams.id;

  // Support temporary new-record docname pattern like 'new-sales-stage-xxxx'
  if (stageId.startsWith('new-sales-stage-')) {
    return <NewSalesStagePage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [stageName, setStageName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSalesStage(stageId)
      .then((data) => {
        if (data) {
          setStageName(data.name || '');
          setSortOrder(String(data.sortOrder ?? 0));
          setIsActive(data.isActive !== false);
          setDirty(false);
        } else {
          toast.error('Sales Stage not found');
          router.push('/crm/sales-stage');
        }
      })
      .catch(() => {
        toast.error('Failed to load sales stage');
        router.push('/crm/sales-stage');
      })
      .finally(() => setLoading(false));
  }, [stageId, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = stageName.trim();
    if (!name) {
      toast.error('Stage Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateSalesStage(stageId, {
        name,
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive,
      } as any);

      toast.success('Sales Stage updated');
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete stage "${stageName}"?`)) return;
    setDeleting(true);
    try {
      await deleteSalesStage(stageId);
      toast.success('Sales Stage deleted');
      router.push('/crm/sales-stage');
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
        Loading sales stage…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title={stageName || 'Sales Stage'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/sales-stage')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/sales-stage/new"
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
              <DeskSideCard title="Stage Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Pipeline Order:</strong> Stages appear in Opportunities and Kanban boards in order of their sequence number.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive stages cannot be assigned to new deals.
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
                <Layers className="w-4 h-4 text-[#014582]" />
                Sales Stage Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Stage Name" required>
                  <input
                    type="text"
                    required
                    value={stageName}
                    onChange={(e) => {
                      setStageName(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Sort Order Sequence">
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Lower numbers appear earlier in the pipeline (e.g. 0, 1, 2...).
                  </p>
                </DeskField>

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

