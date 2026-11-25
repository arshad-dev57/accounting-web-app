'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createMarketSegment } from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';

function NewMarketSegmentForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = segmentName.trim();
    if (!name) {
      toast.error('Segment Name is required');
      return;
    }

    setSaving(true);
    try {
      await createMarketSegment({
        name,
        description: description.trim() || undefined,
        isActive,
      } as any);

      toast.success(`Market Segment "${name}" created successfully`);
      router.push('/crm/market-segment');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create market segment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title="New Market Segment"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/market-segment')}
        actions={
          <Link
            href="/crm/market-segment"
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
              <DeskSideCard title="Segment Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Target Profile:</strong> Group prospects and accounts into distinct business tiers (e.g. Corporate, SME, Government) for strategic outreach.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive segments are excluded from prospect forms.
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
                <PieChart className="w-4 h-4 text-[#014582]" />
                Market Segment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Segment Name" required>
                  <input
                    type="text"
                    required
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="e.g. Corporate, SME, Enterprise, Government"
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <div className="md:col-span-2">
                  <DeskField label="Description">
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional demographic or economic criteria for this segment…"
                      className={deskInput}
                    />
                  </DeskField>
                </div>

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

export default function NewMarketSegmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Market Segment form…
        </div>
      }
    >
      <NewMarketSegmentForm />
    </Suspense>
  );
}

