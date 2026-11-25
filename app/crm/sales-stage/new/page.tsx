'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSalesStage } from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';

function NewSalesStageForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [stageName, setStageName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = stageName.trim();
    if (!name) {
      toast.error('Stage Name is required');
      return;
    }

    setSaving(true);
    try {
      await createSalesStage({
        name,
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive,
      } as any);

      toast.success(`Sales Stage "${name}" created successfully`);
      router.push('/crm/sales-stage');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sales stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title="New Sales Stage"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/sales-stage')}
        actions={
          <Link
            href="/crm/sales-stage"
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
              <DeskSideCard title="Stage Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Pipeline Order:</strong> Stages appear in Opportunities, Kanban boards, and Funnel analytics in order of their sequence number.
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
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. Qualification, Value Proposition"
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <DeskField label="Sort Order Sequence">
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="0"
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
                      onChange={(e) => setIsActive(e.target.checked)}
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

export default function NewSalesStagePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Sales Stage form…
        </div>
      }
    >
      <NewSalesStageForm />
    </Suspense>
  );
}

