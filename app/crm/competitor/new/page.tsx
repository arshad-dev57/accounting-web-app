'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swords, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCompetitor } from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';

function NewCompetitorForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [competitorName, setCompetitorName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = competitorName.trim();
    if (!name) {
      toast.error('Competitor Name is required');
      return;
    }

    setSaving(true);
    try {
      await createCompetitor({
        name,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      } as any);

      toast.success(`Competitor "${name}" created successfully`);
      router.push('/crm/competitor');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create competitor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title="New Competitor"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/competitor')}
        actions={
          <Link
            href="/crm/competitor"
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
              <DeskSideCard title="Competitor Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Competitive Intelligence:</strong> Track competitors across active deals to measure head-to-head win/loss rates.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive competitors will not appear in the Opportunity competitor picker.
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
                <Swords className="w-4 h-4 text-[#014582]" />
                Competitor Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Competitor Name" required>
                  <input
                    type="text"
                    required
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    placeholder="e.g. Acme Corp, Competitor Solutions Ltd."
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <DeskField label="Website">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className={deskInput}
                  />
                </DeskField>

                <div className="md:col-span-2">
                  <DeskField label="Description / Intel">
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notes on competitor pricing, strengths, weaknesses, or market segment focus…"
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

export default function NewCompetitorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Competitor form…
        </div>
      }
    >
      <NewCompetitorForm />
    </Suspense>
  );
}

